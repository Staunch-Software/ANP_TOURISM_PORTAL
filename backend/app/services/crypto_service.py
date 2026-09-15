import json
import base64

from nacl.signing import SigningKey
from nacl.exceptions import BadSignatureError

from app.core.config import settings

_raw_key = bytes.fromhex(settings.ED25519_PRIVATE_KEY_HEX.ljust(64, '0')[:64])
SERVER_SIGNING_KEY = SigningKey(_raw_key)
SERVER_VERIFY_KEY = SERVER_SIGNING_KEY.verify_key


def get_public_key_hex() -> str:
    """Returns the Public Key that will be baked into the offline gate scanners"""
    return SERVER_VERIFY_KEY.encode().hex()


def sign_ticket_payload(payload_dict: dict) -> tuple[str, str]:
    """
    Minifies JSON payload and generates Ed25519 asymmetric signature.
    Returns (raw_compact_json, signature_base64)
    """
    compact_json = json.dumps(payload_dict, separators=(',', ':'), sort_keys=True)
    raw_bytes = compact_json.encode('utf-8')

    signed = SERVER_SIGNING_KEY.sign(raw_bytes)
    signature_b64 = base64.urlsafe_b64encode(signed.signature).decode('utf-8')

    return compact_json, signature_b64


def verify_ticket_offline(payload_json: str, signature_b64: str) -> bool:
    """
    Simulates the exact verification that runs on the Android scanner with 0 internet
    """
    try:
        sig_bytes = base64.urlsafe_b64decode(signature_b64.encode('utf-8'))
        msg_bytes = payload_json.encode('utf-8')
        SERVER_VERIFY_KEY.verify(msg_bytes, sig_bytes)
        return True
    except (BadSignatureError, Exception):
        return False
