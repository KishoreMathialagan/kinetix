import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import OtpRequest, RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self):
        super().__init__(RefreshToken)

    async def get_by_token(self, db: AsyncSession, *, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, db: AsyncSession, *, user_id: uuid.UUID) -> None:
        stmt = update(RefreshToken).where(
            RefreshToken.user_id == user_id, 
            RefreshToken.revoked_at.is_(None)
        ).values(revoked_at=datetime.utcnow())
        await db.execute(stmt)
        await db.commit()


class OtpRequestRepository(BaseRepository[OtpRequest]):
    def __init__(self):
        super().__init__(OtpRequest)

    async def get_valid_otp(self, db: AsyncSession, *, user_id: uuid.UUID, otp_code: str, purpose: str) -> OtpRequest | None:
        now = datetime.utcnow()
        stmt = select(OtpRequest).where(
            OtpRequest.user_id == user_id,
            OtpRequest.otp_code == otp_code,
            OtpRequest.purpose == purpose,
            OtpRequest.verified_at.is_(None),
            OtpRequest.expires_at > now
        ).order_by(OtpRequest.created_at.desc())
        
        result = await db.execute(stmt)
        return result.scalars().first()

refresh_token_repo = RefreshTokenRepository()
otp_request_repo = OtpRequestRepository()
