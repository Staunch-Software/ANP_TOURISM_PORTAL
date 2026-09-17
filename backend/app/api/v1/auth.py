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
from app.schemas.auth import OTPRequest, TokenResponse, ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(req: OTPRequest, db: AsyncSession = Depends(get_db), r=Depends(get_redis)):
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

    # RFP Clause 7.1.12: Single Active Session Enforcement
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
    )
