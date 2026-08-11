import datetime
import uuid
from typing import Any

import jwt
from passlib.context import CryptContext  # type: ignore[import-untyped]

from app.config import settings

# Password hashing using Argon2 as preferred by security.md
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def create_access_token(
    subject: str | Any, expires_delta: datetime.timedelta | None = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # We use subject as the sub claim, which represents the user ID
    to_encode = {"exp": expire, "sub": str(subject), "type": "access", "jti": str(uuid.uuid4())}
    # In a real environment using RS256, SECRET_KEY would be the private key
    # For now, it will be handled by the configured algorithm in PyJWT
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: str | Any, expires_delta: datetime.timedelta | None = None
) -> str:
    """Create a JWT refresh token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh", "jti": str(uuid.uuid4())}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    # In a real environment using RS256, SECRET_KEY would be the public key
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
