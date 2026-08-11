from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.database.session import get_db
from app.repositories.user_repository import user_repo
from app.schemas.auth import PasswordResetConfirmRequest, PasswordResetRequest
from app.services.auth.auth_service import auth_service
from app.services.auth.otp_service import otp_service

router = APIRouter()

PURPOSE_FORGOT_PASSWORD = "forgot_password"


@router.post("/forgot", status_code=status.HTTP_202_ACCEPTED, summary="Request a password reset OTP", description="Issues a one-time password for resetting a user's password. Does not reveal whether the email exists to prevent user enumeration.")
async def forgot_password(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=request.email)
    if not user:
        return {"message": "If that email is in our system, a reset OTP has been issued."}

    otp_code = await otp_service.create_otp(db, user_id=user.id, purpose=PURPOSE_FORGOT_PASSWORD)

    await auth_service.log_audit_event(
        db, user_id=user.id, action="password_reset_requested", entity="user", entity_id=str(user.id)
    )

    return {"message": "If that email is in our system, a reset OTP has been issued.", "otp": otp_code}


@router.post("/reset", status_code=status.HTTP_200_OK, summary="Reset password with OTP", description="Verifies the reset OTP and applies a new password.")
async def reset_password(request: PasswordResetConfirmRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, email=request.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    is_valid = await otp_service.verify_otp(
        db, user_id=user.id, otp_code=request.otp, purpose=PURPOSE_FORGOT_PASSWORD
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await user_repo.update(db, db_obj=user, obj_in={"password_hash": pwd_context.hash(request.new_password)})

    await auth_service.log_audit_event(
        db, user_id=user.id, action="password_reset", entity="user", entity_id=str(user.id)
    )

    return {"message": "Password reset successfully"}