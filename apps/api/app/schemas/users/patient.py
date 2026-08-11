import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import BloodGroup, Gender
from app.schemas.users.user import UserResponse


class PatientBase(BaseModel):
    dob: date | None = None
    gender: Gender | None = None
    blood_group: BloodGroup | None = None
    occupation: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    emergency_phone: str | None = None
    medical_history: str | None = None
    allergies: str | None = None
    medications: str | None = None
    diagnosis: str | None = None
    referred_by: str | None = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: uuid.UUID
    user_id: uuid.UUID
    patient_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientProfileResponse(BaseModel):
    user: UserResponse
    profile: PatientResponse

    class Config:
        from_attributes = True
