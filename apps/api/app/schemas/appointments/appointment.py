import uuid
from datetime import date, time

from pydantic import BaseModel

from app.models.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    scheduled_date: date
    start_time: time
    duration_minutes: int
    appointment_type: str | None = None
    address: str | None = None
    notes: str | None = None

class AppointmentUpdate(BaseModel):
    status: AppointmentStatus | None = None
    notes: str | None = None

class RescheduleRequest(BaseModel):
    scheduled_date: date
    start_time: time
    duration_minutes: int
    reason: str | None = None

class CancelRequest(BaseModel):
    reason: str

class AppointmentSummary(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    scheduled_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    appointment_type: str | None = None
    status: AppointmentStatus

    class Config:
        from_attributes = True

class AppointmentResponse(AppointmentSummary):
    address: str | None = None
    notes: str | None = None
    cancellation_reason: str | None = None
    created_by: uuid.UUID | None = None

class AppointmentSearchRequest(BaseModel):
    patient_id: uuid.UUID | None = None
    therapist_id: uuid.UUID | None = None
    status: AppointmentStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    page: int = 1
    size: int = 20
