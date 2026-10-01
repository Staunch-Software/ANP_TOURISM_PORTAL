"""
WhatsApp delivery via the official Meta WhatsApp Cloud API (free tier --
1,000 conversations/month, no ToS risk, no QR-scanned phone to babysit).
Deliberately NOT using an unofficial WhatsApp Web scraper (e.g. Baileys):
those get automated/high-volume numbers banned and drop connection
mid-demo, which is unacceptable for a government RFP.

Configure via WHATSAPP_CLOUD_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID
(app/core/config.py). Both empty by default, in which case every function
here silently no-ops -- same pattern as email_service.py with no SMTP
creds -- so login/payment flows never depend on this being configured.

Sending a template message (send_whatsapp_otp) requires that template to
be created and approved in the Meta Business Manager first; until that's
done, this will log a failure and the caller is unaffected either way.
Freeform text messages (send_whatsapp_ticket_confirmation) only deliver
within Meta's 24-hour customer-service window (i.e. after the user has
messaged the business number at least once) -- also fine for a demo
context, and callers here don't depend on it succeeding.
"""
import asyncio
import io
import logging

import qrcode
import requests

from app.core.config import settings

logger = logging.getLogger("anp.whatsapp")

GRAPH_API_VERSION = "v18.0"


def _is_configured() -> bool:
    return bool(settings.WHATSAPP_CLOUD_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)


def _to_e164(phone_number: str) -> str:
    digits = "".join(ch for ch in str(phone_number) if ch.isdigit())
    return digits if len(digits) > 10 else f"91{digits}"


def _post_sync(payload: dict, phone_number: str, label: str) -> None:
    if not _is_configured():
        # SECURITY: Do not name specific env variable keys in logs
        logger.warning(f"Skipping WhatsApp {label} — API credentials not configured")
        return

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    # SECURITY: Authorization token is in headers only — never logged anywhere
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_CLOUD_API_TOKEN}"}

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        if resp.status_code == 200:
            logger.info(f"Sent WhatsApp {label} to {phone_number}")
        else:
            # SECURITY: Do NOT log resp.text — Meta API error responses can contain
            # auth context, token fragments, or user phone data
            logger.error(f"WhatsApp Cloud API returned HTTP {resp.status_code} for {label} (response body hidden)")
    except Exception as e:
        logger.error(f"Failed to reach WhatsApp Cloud API for {label}: {e}")


def _make_qr_png_bytes(qr_data: str) -> bytes:
    img = qrcode.make(qr_data)
    # Convert to RGB to satisfy Meta's strict requirement for 8-bit/channel
    img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _upload_media_sync(image_bytes: bytes) -> str:
    """Uploads the QR image to Meta's servers (required before it can be
    referenced in an outgoing message -- there's no localhost-reachable
    public URL to point at instead) and returns the resulting media id."""
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/media"
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_CLOUD_API_TOKEN}"}
    files = {"file": ("boarding-pass-qr.png", image_bytes, "image/png")}
    data = {"messaging_product": "whatsapp", "type": "image/png"}

    resp = requests.post(url, headers=headers, files=files, data=data, timeout=15)
    resp.raise_for_status()
    return resp.json()["id"]


def _send_qr_image_sync(phone_number: str, qr_data: str, caption: str) -> None:
    if not _is_configured():
        logger.warning("Skipping WhatsApp QR image — API credentials not configured")
        return

    try:
        image_bytes = _make_qr_png_bytes(qr_data)
        media_id = _upload_media_sync(image_bytes)
    except Exception as e:
        logger.error(f"Failed to generate/upload QR image: {e}")
        return

    payload = {
        "messaging_product": "whatsapp",
        "to": _to_e164(phone_number),
        "type": "image",
        "image": {"id": media_id, "caption": caption},
    }
    _post_sync(payload, phone_number, "QR boarding pass image")


async def send_whatsapp_otp(phone_number: str, otp_code: str) -> None:
    payload = {
        "messaging_product": "whatsapp",
        "to": _to_e164(phone_number),
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_OTP_TEMPLATE_NAME,
            "language": {"code": settings.WHATSAPP_OTP_TEMPLATE_LANG},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": otp_code}]
                }
            ],
        },
    }
    await asyncio.to_thread(_post_sync, payload, phone_number, "OTP template")


async def send_whatsapp_ticket_confirmation(phone_number: str, order_ref: str, tickets: list) -> None:
    if not tickets:
        return
        
    head = tickets[0]
    qr_data = f"{head.qr_payload_json}|SIG:{head.qr_signature_b64}"
    
    # The template requires an image header, so upload the QR code first.
    try:
        def _get_media_id():
            return _upload_media_sync(_make_qr_png_bytes(qr_data))
        media_id = await asyncio.to_thread(_get_media_id)
    except Exception as e:
        logger.error(f"Failed to generate/upload QR image for ticket confirmation: {e}")
        return

    # Template variables based on the 'ticket_confirmation' template format:
    # {{1}}: Passenger Name
    # {{2}}: Attraction Name
    # {{3}}: Order Reference
    payload = {
        "messaging_product": "whatsapp",
        "to": _to_e164(phone_number),
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_TICKET_TEMPLATE_NAME,
            "language": {"code": settings.WHATSAPP_TICKET_TEMPLATE_LANG},
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "image",
                            "image": {"id": media_id}
                        }
                    ]
                },
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": order_ref},
                        {"type": "text", "text": head.passenger_name}
                    ]
                }
            ]
        }
    }
    await asyncio.to_thread(_post_sync, payload, phone_number, "ticket confirmation template")

async def send_whatsapp_voyage_cancellation(phone_number: str, order_ref: str, route: str, reason: str, refund_amount: float) -> None:
    text = (
        f"*SAILING CANCELLED*\n\n"
        f"Your ferry booking {order_ref} ({route}) has been cancelled by ANIIDCO due to: {reason}.\n\n"
        f"A full refund of Rs.{refund_amount:.2f} has been automatically initiated to your original payment method.\n\n"
        f"We apologise for the inconvenience."
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": _to_e164(phone_number),
        "type": "text",
        "text": {"body": text},
    }
    await asyncio.to_thread(_post_sync, payload, phone_number, "voyage cancellation notice")

