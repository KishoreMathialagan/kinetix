import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import BloodGroup, Gender


class PatientRegistrationRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    dob: date
    gender: Gender
    blood_group: BloodGroup | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    height: str | None = None
    weight: str | None = None
    blood_pressure: str | None = None
    temperature_spo2: str | None = None
    emergency_contact: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_phone: str | None = None
    emergency_contact_address: str | None = None
    primary_concern: str | None = None
    medical_history: str | None = None
    allergies: str | None = None
    medications: str | None = None
    insurance_provider: str | None = None
    insurance_policy_number: str | None = None

class PatientUpdateRequest(BaseModel):
    dob: date | None = None
    gender: Gender | None = None
    blood_group: BloodGroup | None = None
    occupation: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    height: str | None = None
    weight: str | None = None
    blood_pressure: str | None = None
    temperature_spo2: str | None = None
    emergency_contact: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_phone: str | None = None
    emergency_contact_address: str | None = None
    primary_concern: str | None = None
    medical_history: str | None = None
    allergies: str | None = None
    medications: str | None = None
    diagnosis: str | None = None
    referred_by: str | None = None
    insurance_provider: str | None = None
    insurance_policy_number: str | None = None

class PatientResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    patient_code: str
    dob: date | None = None
    gender: Gender | None = None
    blood_group: BloodGroup | None = None
    occupation: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    height: str | None = None
    weight: str | None = None
    blood_pressure: str | None = None
    temperature_spo2: str | None = None
    emergency_contact: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_phone: str | None = None
    emergency_contact_address: str | None = None
    primary_concern: str | None = None
    medical_history: str | None = None
    allergies: str | None = None
    medications: str | None = None
    diagnosis: str | None = None
    referred_by: str | None = None
    insurance_provider: str | None = None
    insurance_policy_number: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientSearchRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    gender: Gender | None = None
