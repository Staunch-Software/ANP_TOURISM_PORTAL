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
    has_password: bool = False  # RFP 7.2.1-1: whether first-time password setup is already done
    approval_status: Optional[str] = None  # PENDING/APPROVED/REJECTED if they applied as a service provider


class SetPasswordRequest(BaseModel):
    password: str


class PasswordLoginRequest(BaseModel):
    phone_number: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
    nationality: str
    state_or_country: str


class OperatorRegistrationRequest(BaseModel):
    business_name: str
    gstin: str
    trade_license_number: str
    service_category: str  # FERRY_OPERATOR, WATER_SPORTS
    email: str


class OperatorRegistrationResponse(BaseModel):
    user_id: str
    business_name: str
    approval_status: str
    message: str
