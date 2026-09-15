from pydantic import BaseModel


class OTPRequest(BaseModel):
    phone_number: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    phone: str
