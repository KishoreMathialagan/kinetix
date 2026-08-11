import uuid
from datetime import date, time

from pydantic import BaseModel


class AvailabilityCreate(BaseModel):
    weekday: int | None = None
    specific_date: date | None = None
    start_time: time
    end_time: time
    is_available: bool = True
    reason: str | None = None

class AvailabilityResponse(BaseModel):
    id: uuid.UUID
    therapist_id: uuid.UUID
    weekday: int | None = None
    specific_date: date | None = None
    start_time: time
    end_time: time
    is_available: bool
    reason: str | None = None

    class Config:
        from_attributes = True

class LeaveRequest(BaseModel):
    leave_type: str
    reason: str | None = None
    start_date: date
    end_date: date

class LeaveResponse(BaseModel):
    id: uuid.UUID
    therapist_id: uuid.UUID
    leave_type: str
    reason: str | None = None
    start_date: date
    end_date: date
    status: str
    admin_notes: str | None = None

    class Config:
        from_attributes = True

class CapacityResponse(BaseModel):
    therapist_id: uuid.UUID
    max_capacity: int
    active_patients: int
    remaining_capacity: int
    upcoming_appointments_count: int # placeholder
    availability_score: float # placeholder

class DashboardDTO(BaseModel):
    therapist_id: uuid.UUID
    todays_appointments_count: int
    active_patients_count: int
    availability_status: str
    profile_completion_percentage: float
