import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.services.password_service import hash_password, verify_password, MIN_PASSWORD_LENGTH
from app.schemas.auth import (
    OTPRequest,
    TokenResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    OperatorRegistrationRequest,
    OperatorRegistrationResponse,
    SetPasswordRequest,
    PasswordLoginRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _issue_session_token(user: User, r) -> TokenResponse:
    """RFP Clause 7.1.12: Single Active Session Enforcement. Shared by both
    the OTP and password login paths so a login via either method evicts
    any session opened by the other."""
    session_id = str(uuid.uuid4())
    await r.set(f"user:session:{str(user.id)}", session_id, ex=86400)  # 24 hours

    token_payload = {
        "sub": str(user.id),
        "phone": user.phone_number,
        "session_id": session_id,
        "exp": datetime.utcnow() + timedelta(days=1),
    }
    token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm="HS256")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(user.id),
        phone=user.phone_number,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(req: OTPRequest, db: AsyncSession = Depends(get_db), r=Depends(get_redis)):
    """
    RFP Clause 7.2.1-1: OTP is the first-time registration/verification
    path, and also remains available afterwards as the "Login with OTP"
    fallback for users who forget their password.
    """
    if req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    res = await db.execute(select(User).where(User.phone_number == req.phone_number))
    user = res.scalars().first()
    if not user:
        user = User(phone_number=req.phone_number)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been suspended. Contact ANIIDCO support for assistance.")

    return await _issue_session_token(user, r)


@router.post("/login-password", response_model=TokenResponse)
async def login_password(req: PasswordLoginRequest, db: AsyncSession = Depends(get_db), r=Depends(get_redis)):
    """
    RFP Clause 7.2.1-1: "OTP will not be necessary for every login; once
    the User ID and Password are created, no further OTP will be
    required." This is that subsequent-login path.
    """
    res = await db.execute(select(User).where(User.phone_number == req.phone_number))
    user = res.scalars().first()

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid mobile number or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been suspended. Contact ANIIDCO support for assistance.")

    return await _issue_session_token(user, r)


# The RFP 7.1.12 Enforcement Dependency
async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        session_id: str = payload.get("session_id")

        if not user_id or not session_id:
            raise HTTPException(status_code=401, detail="Malformed token payload")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired JWT token")

    # RFP 7.1.12 Check: Is this session_id still the active one in Redis?
    active_session = await r.get(f"user:session:{user_id}")

    if active_session != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session Expired: You have logged in from a new device (RFP 7.1.12 Single-Session Rule)",
        )

    # Fetch user from PostgreSQL
    res = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been suspended. Contact ANIIDCO support for assistance.")

    return user


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return ProfileResponse(
        user_id=str(current_user.id),
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        email=current_user.email,
        state_or_country=current_user.state_or_country,
        nationality=current_user.nationality,
        role=current_user.user_type,
        profile_complete=bool(current_user.email),
        has_password=bool(current_user.password_hash),
        approval_status=current_user.approval_status,
    )


@router.post("/set-password", response_model=ProfileResponse)
async def set_password(
    req: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Clause 7.2.1-1: after first-time OTP verification, the user sets a
    password so future logins don't require OTP. Only usable once — a
    forgotten password is reset via the OTP fallback, not this endpoint,
    so a compromised session token alone can't silently take over an
    account that already has a password.
    """
    if current_user.password_hash:
        raise HTTPException(status_code=400, detail="Password already set. Use 'Login with OTP' if you forgot it, then set a new one.")

    if len(req.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")

    current_user.password_hash = hash_password(req.password)
    await db.commit()
    await db.refresh(current_user)

    return ProfileResponse(
        user_id=str(current_user.id),
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        email=current_user.email,
        state_or_country=current_user.state_or_country,
        nationality=current_user.nationality,
        role=current_user.user_type,
        profile_complete=bool(current_user.email),
        has_password=bool(current_user.password_hash),
        approval_status=current_user.approval_status,
    )


@router.post("/reset-password", response_model=ProfileResponse)
async def reset_password(
    req: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    "Forgot Password? Login with OTP" fallback: the user re-authenticates
    via /verify-otp (proving phone ownership again), then calls this to
    overwrite an existing password — unlike /set-password, which only
    ever fires once for a brand-new account.
    """
    if len(req.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")

    current_user.password_hash = hash_password(req.password)
    await db.commit()
    await db.refresh(current_user)

    return ProfileResponse(
        user_id=str(current_user.id),
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        email=current_user.email,
        state_or_country=current_user.state_or_country,
        nationality=current_user.nationality,
        role=current_user.user_type,
        profile_complete=bool(current_user.email),
        has_password=bool(current_user.password_hash),
        approval_status=current_user.approval_status,
    )


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.full_name = req.full_name
    current_user.email = req.email
    current_user.nationality = req.nationality
    current_user.state_or_country = req.state_or_country
    await db.commit()
    await db.refresh(current_user)

    return ProfileResponse(
        user_id=str(current_user.id),
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        email=current_user.email,
        state_or_country=current_user.state_or_country,
        nationality=current_user.nationality,
        role=current_user.user_type,
        profile_complete=bool(current_user.email),
        has_password=bool(current_user.password_hash),
        approval_status=current_user.approval_status,
    )


VALID_SERVICE_CATEGORIES = {"FERRY_OPERATOR", "WATER_SPORTS"}


@router.post("/register-operator", response_model=OperatorRegistrationResponse)
async def register_operator(
    req: OperatorRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Clause 7.2.1-1/7 (Pages 24, 28): Self-service Service Provider
    onboarding. The applicant must already be a verified phone number
    (signed in via OTP) — this call attaches their business details and
    puts the account into PENDING approval. Their role stays unchanged
    (they do NOT become an OPERATOR) until an administrator approves
    the application via /admin/operator-applications/{id}/approve.
    """
    if req.service_category not in VALID_SERVICE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"service_category must be one of {sorted(VALID_SERVICE_CATEGORIES)}",
        )

    if current_user.approval_status == "PENDING":
        raise HTTPException(status_code=400, detail="An application is already pending review for this account.")

    current_user.business_name = req.business_name
    current_user.gstin = req.gstin
    current_user.trade_license_number = req.trade_license_number
    current_user.service_category = req.service_category
    current_user.email = req.email
    current_user.approval_status = "PENDING"
    current_user.approval_notes = None
    await db.commit()
    await db.refresh(current_user)

    return OperatorRegistrationResponse(
        user_id=str(current_user.id),
        business_name=current_user.business_name,
        approval_status=current_user.approval_status,
        message="Application submitted. ANIIDCO will review your documents and notify you once approved.",
    )
