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

    class Config:
        env_file = ".env"


settings = Settings()
