from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "ANIIDCO Tourism Portal"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ED25519_PRIVATE_KEY_HEX: str

    # --- LPU fleet sync (app/api/v1/sync.py) ---
    # Shared secret every LPU site's .env also carries as SYNC_API_KEY --
    # these are unattended site devices authenticating with a static key,
    # not per-user JWTs.
    SYNC_API_KEY: str = "change-this-lpu-sync-key-in-production"
    # Public half of the LPU fleet's own signing keypair -- lets this
    # server (and, via /tickets/public-key, freshly provisioned gate
    # hardware) verify a QR that was signed offline at an LPU counter
    # instead of by this server's own ED25519_PRIVATE_KEY_HEX. Only the
    # public half ever lives here; the private half stays on LPU devices.
    LPU_ED25519_PUBLIC_KEY_HEX: str = ""

    # --- Google Sign-In (Tourist login) ---
    # OAuth Client ID from Google Cloud Console (APIs & Services >
    # Credentials). Empty by default so the app still runs without it --
    # the frontend hides "Continue with Google" until this is configured.
    GOOGLE_CLIENT_ID: str = ""

    # --- Razorpay Configuration ---
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # --- Email (SMTP) Configuration ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@andamantourism.gov.in"

    # --- WhatsApp (official Meta Cloud API, free tier) ---
    # From Meta for Developers -> your app -> WhatsApp -> API Setup.
    # Empty by default so the app runs fine without it; whatsapp_service.py
    # no-ops (like email does with no SMTP creds) rather than failing.
    WHATSAPP_CLOUD_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    # Name of the approved message template used for OTP delivery (Meta
    # requires OTP-style templates to be pre-approved in Business Manager).
    WHATSAPP_OTP_TEMPLATE_NAME: str = "tourism_login_otp_v2"
    WHATSAPP_OTP_TEMPLATE_LANG: str = "en"
    
    WHATSAPP_TICKET_TEMPLATE_NAME: str = "ticket_booking_confirmation"
    WHATSAPP_TICKET_TEMPLATE_LANG: str = "en_GB"
    
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = "AndamanDemoWebhook2026"

    # Developer-stage safety net: the Meta developer WhatsApp token expires
    # daily and the test number only reaches pre-approved recipients, so OTP
    # delivery is often down while developing. When the WhatsApp send fails
    # (or isn't configured), the OTP becomes OTP_DEV_FALLBACK_CODE instead of
    # nobody being able to log in. A successful WhatsApp send always uses the
    # random code, so this never weakens a working deployment. MUST be set to
    # false in production -- with it on, a WhatsApp outage means anyone can
    # log in as anyone using the fixed code.
    OTP_DEV_FALLBACK: bool = True
    OTP_DEV_FALLBACK_CODE: str = "123456"
    
    # --- AI Settings ---
    GEMINI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
