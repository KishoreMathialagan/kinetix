import uuid
from datetime import date

from pydantic import BaseModel, EmailStr

from app.models.enums import Gender, TherapistStatus


class TherapistCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    license_number: str
    registration_number: str
    department: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    languages: str | None = None
    years_experience: int | None = None
    gender: Gender | None = None
    dob: date | None = None
    address: str | None = None
    emergency_contact: str | None = None
    joining_date: date | None = None
    capacity: int | None = 10

class TherapistUpdate(BaseModel):
    department: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    languages: str | None = None
    years_experience: int | None = None
    address: str | None = None
    emergency_contact: str | None = None
    status: TherapistStatus | None = None
    capacity: int | None = None

class TherapistResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    license_number: str
    registration_number: str
    department: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    languages: str | None = None
    years_experience: int | None = None
    gender: Gender | None = None
    dob: date | None = None
    address: str | None = None
    emergency_contact: str | None = None
    joining_date: date | None = None
    status: TherapistStatus
    capacity: int

    class Config:
        from_attributes = True

class TherapistSummary(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    specialization: str | None = None
    department: str | None = None
    status: TherapistStatus
    active_patients: int
    max_capacity: int
    availability_score: float

class TherapistListResponse(BaseModel):
    items: list[TherapistSummary]
    total: int
    page: int
    size: int
    pages: int
