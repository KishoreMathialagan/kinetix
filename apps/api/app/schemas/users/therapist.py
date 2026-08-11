import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import TherapistStatus
from app.schemas.users.user import UserResponse


class TherapistBase(BaseModel):
    qualification: str | None = None
    specialization: str | None = None
    years_experience: int | None = None
    availability: str | None = None
    joining_date: date | None = None

class TherapistCreate(TherapistBase):
    registration_number: str

class TherapistUpdate(TherapistBase):
    status: TherapistStatus | None = None

class TherapistResponse(TherapistBase):
    id: uuid.UUID
    user_id: uuid.UUID
    registration_number: str
    status: TherapistStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TherapistProfileResponse(BaseModel):
    user: UserResponse
    profile: TherapistResponse

    class Config:
        from_attributes = True
