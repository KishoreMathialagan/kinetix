from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repositories.user_repository import user_repo
from app.schemas.auth import OtpSendRequest, OtpVerificationRequest
from app.services.auth.auth_service import auth_service
from app.services.auth.otp_service import otp_service

router = APIRouter()


@router.post("/send", status_code=status.HTTP_202_ACCEPTED, summary="Send an OTP", description="Issues a one-time password for registration, login or password reset.")
async def send_otp(request: OtpSendRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=request.email)
    # Do not reveal whether the email exists for forgot-password/reset purposes.
    if not user and request.purpose.value in ("registration", "login"):
        raise HTTPException(status_code=400, detail="User not found")
    if not user:
        return {"message": "If that email is in our system, an OTP has been issued."}

    otp_code = await otp_service.create_otp(db, user_id=user.id, purpose=request.purpose.value)

    if request.purpose.value == "forgot_password":
        await auth_service.log_audit_event(
            db, user_id=user.id, action="otp_sent_forgot_password", entity="user", entity_id=str(user.id)
        )

    return {"message": "OTP issued (delivery simulated in development).", "otp": otp_code}


@router.post("/verify", status_code=status.HTTP_200_OK, summary="Verify an OTP", description="Verifies an OTP code. For registration this also marks the user as verified.")
async def verify_otp(request: OtpVerificationRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=request.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    is_valid = await otp_service.verify_otp(
        db, user_id=user.id, otp_code=request.otp, purpose=request.purpose.value
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if request.purpose.value == "registration" and not user.is_verified:
        await user_repo.update(db, db_obj=user, obj_in={"is_verified": True})

    await auth_service.log_audit_event(
        db, user_id=user.id, action="otp_verified", entity="user", entity_id=str(user.id)
    )

    return {"message": "OTP verified successfully"}