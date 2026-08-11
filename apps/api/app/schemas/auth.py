import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Gender, OtpPurpose


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(..., min_length=8)
    dob: date | None = None
    gender: Gender | None = None
    blood_group: str | None = None
    address: str | None = None

class OtpSendRequest(BaseModel):
    email: EmailStr
    purpose: OtpPurpose

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=8)

class OtpVerificationRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: OtpPurpose = OtpPurpose.REGISTRATION

class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    role: str | None = None
    is_verified: bool
    is_active: bool
    patient_id: uuid.UUID | None = None
    therapist_id: uuid.UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True
