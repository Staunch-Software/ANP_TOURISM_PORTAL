from typing import Optional

from pydantic import BaseModel


class OTPRequest(BaseModel):
    phone_number: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    phone: str


class ProfileResponse(BaseModel):
    user_id: str
    phone_number: str
    full_name: str
    email: Optional[str] = None
    state_or_country: Optional[str] = None
    nationality: str
    role: str
    profile_complete: bool


class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
    nationality: str
    state_or_country: str
