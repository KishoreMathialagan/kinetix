import hashlib
import secrets
import uuid
from datetime import datetime, timedelta

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.models.core import RefreshToken, User
from app.repositories.auth_repository import refresh_token_repo


class TokenService:
    @staticmethod
    def create_access_token(user: User, permissions: list[str]) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {
            "sub": str(user.id),
            "jti": str(uuid.uuid4()),
            "exp": expire,
            "iat": datetime.utcnow(),
            "token_type": "access",
            "role": user.role.name,
            "permissions": permissions
        }
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def create_refresh_token(db: AsyncSession, user_id: uuid.UUID) -> str:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Save hash in DB
        await refresh_token_repo.create(db, obj_in={
            "user_id": user_id,
            "token_hash": token_hash,
            "expires_at": expire
        })
        
        return raw_token

    @staticmethod
    async def verify_refresh_token(db: AsyncSession, raw_token: str) -> RefreshToken | None:
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        token = await refresh_token_repo.get_by_token(db, token_hash=token_hash)
        
        if not token:
            return None
            
        if token.revoked_at or token.expires_at < datetime.utcnow():
            return None
            
        return token

token_service = TokenService()
