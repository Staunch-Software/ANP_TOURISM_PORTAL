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
