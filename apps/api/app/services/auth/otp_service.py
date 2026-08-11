import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.repositories.auth_repository import otp_request_repo


class OtpService:
    @staticmethod
    async def create_otp(db: AsyncSession, user_id: uuid.UUID, purpose: str) -> str:
        # Generate 6 digit code
        otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        expire = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        
        await otp_request_repo.create(db, obj_in={
            "user_id": user_id,
            "otp_code": otp_code,
            "purpose": purpose,
            "expires_at": expire
        })
        
        # In a real app, send OTP via email/SMS here
        
        return otp_code

    @staticmethod
    async def verify_otp(db: AsyncSession, user_id: uuid.UUID, otp_code: str, purpose: str) -> bool:
        otp_req = await otp_request_repo.get_valid_otp(
            db, user_id=user_id, otp_code=otp_code, purpose=purpose
        )
        
        if not otp_req:
            return False
            
        # Mark as verified
        await otp_request_repo.update(
            db, db_obj=otp_req, obj_in={"verified_at": datetime.utcnow()}
        )
        return True

otp_service = OtpService()
