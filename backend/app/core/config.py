from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "ANIIDCO Tourism Portal"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ED25519_PRIVATE_KEY_HEX: str

    class Config:
        env_file = ".env"


settings = Settings()
