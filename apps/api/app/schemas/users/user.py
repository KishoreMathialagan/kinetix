import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_id: uuid.UUID

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None

class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: uuid.UUID
    role_id: uuid.UUID
    is_verified: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
