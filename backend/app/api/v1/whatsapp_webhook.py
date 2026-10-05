import logging
from fastapi import APIRouter, Request, HTTPException, Query, Response
from app.core.config import settings
from app.services.chatbot_service import process_incoming_message
from app.services.whatsapp_service import _post_sync
import asyncio
import time

router = APIRouter()
logger = logging.getLogger("anp.whatsapp_webhook")

@router.get("/webhook")
async def verify_webhook(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """
    Required by Meta to verify the webhook URL.
    """
    if mode and token:
        if mode == "subscribe" and token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
            logger.info("Webhook verified successfully.")
            return Response(content=challenge, status_code=200)
        else:
            # SECURITY: Never log the received token value — it could expose the secret
            raise HTTPException(status_code=403, detail="Verification token mismatch")
    raise HTTPException(status_code=400, detail="Missing parameters")

@router.post("/webhook")
async def handle_whatsapp_message(request: Request):
    """
    Receives incoming messages from WhatsApp.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Fast return to acknowledge receipt (Meta requires a 200 OK quickly)
    if body.get("object") != "whatsapp_business_account":
        return {"status": "ignored"}

    try:
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                statuses = value.get("statuses", [])

                # SECURITY: Log only the delivery status string (sent/delivered/read/failed),
                # NOT the full status dict which can contain phone numbers and message IDs
                for status in statuses:
                    status_val = status.get("status", "unknown")
                    recipient = status.get("recipient_id", "")
                    # Mask all but last 4 digits of phone number in logs
                    masked = ("*" * (len(recipient) - 4) + recipient[-4:]) if len(recipient) > 4 else "****"
                    logger.info(f"WhatsApp delivery status: {status_val} → {masked}")

                for msg in messages:
                    # We only care about incoming text messages
                    if msg.get("type") == "text":
                        phone_number = msg.get("from")
                        text = msg.get("text", {}).get("body", "")
                        timestamp_str = msg.get("timestamp", "0")

                        try:
                            msg_time = int(timestamp_str)
                            # If message is older than 2 minutes, ignore it
                            if time.time() - msg_time > 120:
                                logger.warning(f"Ignoring stale WhatsApp message (age > 120s)")
                                continue
                        except Exception as e:
                            logger.error(f"Error parsing message timestamp: {e}")

                        # SECURITY: Log message receipt WITHOUT the text content.
                        # The user message could contain credential extraction attempts
                        # that would then appear verbatim in server logs.
                        masked_phone = ("*" * (len(phone_number) - 4) + phone_number[-4:]) if len(phone_number) > 4 else "****"
                        logger.info(f"Received WhatsApp message from {masked_phone} [text hidden for security]")

                        # Process with Gemini asynchronously in the background
                        asyncio.create_task(_handle_and_reply(phone_number, text))

                    elif msg.get("type") == "interactive":
                        interactive = msg.get("interactive", {})
                        int_type = interactive.get("type")
                        
                        # Meta usually sends 'payment_transaction_status' or 'payment' for UPI payment success
                        if int_type in ("payment_transaction_status", "payment"):
                            payment_data = interactive.get(int_type, {})
                            status = payment_data.get("status")
                            order_id = payment_data.get("reference_id")
                            
                            if status == "success" and order_id:
                                phone_number = msg.get("from")
                                asyncio.create_task(_handle_payment_success(phone_number, order_id))
                                
    except Exception as e:
        logger.error(f"Error processing webhook payload: {e}")

    # Always return 200 OK immediately
    return {"status": "ok"}

async def _send_whatsapp_text(phone_number: str, text: str, label: str) -> None:
    """Helper to send a plain text WhatsApp message."""
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone_number,
        "type": "text",
        "text": {"preview_url": False, "body": text}
    }
    await asyncio.to_thread(_post_sync, payload, phone_number, label)


async def _handle_and_reply(phone_number: str, message_text: str):
    """Passes text to Gemini and sends the reply via WhatsApp.
    Sends an instant acknowledgement first so the user is not left waiting in silence.
    """
    # Send immediate feedback — user sees this within ~1 second of their message
    await _send_whatsapp_text(phone_number, "Got it! Checking... please wait a moment.", "ack")

    # Now call Gemini (may take 5-15 seconds)
    reply_text = await process_incoming_message(phone_number, message_text)

    # Send the real response
    await _send_whatsapp_text(phone_number, reply_text, "AI Chatbot Reply")


async def _handle_payment_success(phone_number: str, rzp_order_id: str):
    import razorpay
    from app.core.database import AsyncSessionLocal
    from sqlalchemy.future import select
    from app.models.order import Order
    from app.api.v1.payments import razorpay_client
    from app.models.ticket import Ticket
    from app.services.crypto_service import sign_ticket_payload
    import json
    
    try:
        # Fetch the razorpay order to get our internal booking_ref
        rzp_order = razorpay_client.order.fetch(rzp_order_id)
        booking_ref = rzp_order.get("receipt")
        
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Order).where(Order.order_ref == booking_ref))
            order = res.scalars().first()
            if not order:
                logger.error(f"WhatsApp payment succeeded but Order {booking_ref} not found.")
                return
            
            # Since the webhook confirms payment, mark as CONFIRMED
            order.status = "CONFIRMED"
            order.razorpay_payment_id = "wa_native_" + str(int(time.time()))
            
            # Create the Ticket record
            res_items = await order.awaitable_attrs.items
            item = res_items[0]
            
            payload = {
                "ref": order.order_ref,
                "type": item.item_type,
                "title": item.title,
                "info": item.slot_or_seat_info,
                "name": item.passenger_name,
                "id": item.id_number
            }
            compact_json = json.dumps(payload, separators=(',', ':'))
            signature_b64 = sign_ticket_payload(compact_json)

            ticket = Ticket(
                ticket_ref=f"TKT-{order.order_ref[-6:]}-{1}",
                order_id=order.id,
                order_item_id=item.id,
                user_id=order.user_id,
                item_type=item.item_type,
                title=item.title,
                slot_or_seat_info=item.slot_or_seat_info,
                passenger_name=item.passenger_name,
                passenger_age=item.passenger_age,
                passenger_gender=item.passenger_gender,
                id_type=item.id_type,
                id_number=item.id_number,
                qr_payload_json=compact_json,
                qr_signature_b64=signature_b64,
                check_in_status="ISSUED",
                issued_by="CLOUD",
            )
            db.add(ticket)
            await db.commit()
            
            # Send the ticket confirmation via WhatsApp
            from app.services.whatsapp_service import send_whatsapp_ticket_confirmation
            await send_whatsapp_ticket_confirmation(phone_number, order.order_ref, [ticket])
            
    except Exception as e:
        logger.error(f"Failed to process WhatsApp payment success: {e}")
