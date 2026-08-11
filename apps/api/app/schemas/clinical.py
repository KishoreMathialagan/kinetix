import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import AssessmentType, StrengthScale


class AssessmentCreate(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    appointment_id: uuid.UUID
    assessment_type: AssessmentType = AssessmentType.INITIAL
    pain_score: int | None = Field(default=None, ge=0, le=10)
    diagnosis: str | None = None
    findings: str | None = None
    goals: str | None = None
    recommendations: str | None = None


class AssessmentUpdate(BaseModel):
    assessment_type: AssessmentType | None = None
    pain_score: int | None = Field(default=None, ge=0, le=10)
    diagnosis: str | None = None
    findings: str | None = None
    goals: str | None = None
    recommendations: str | None = None


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    appointment_id: uuid.UUID
    assessment_type: AssessmentType
    pain_score: int | None = None
    diagnosis: str | None = None
    findings: str | None = None
    goals: str | None = None
    recommendations: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreatmentSessionCreate(BaseModel):
    appointment_id: uuid.UUID
    assessment_id: uuid.UUID | None = None


class TreatmentSessionUpdate(BaseModel):
    pain_before: int | None = Field(default=None, ge=0, le=10)
    pain_after: int | None = Field(default=None, ge=0, le=10)
    treatment_notes: str | None = None
    exercises: str | None = None
    modalities: str | None = None
    response: str | None = None


class TreatmentSessionResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    appointment_id: uuid.UUID
    assessment_id: uuid.UUID | None = None
    session_number: int | None = None
    pain_before: int | None = None
    pain_after: int | None = None
    treatment_notes: str | None = None
    exercises: str | None = None
    modalities: str | None = None
    response: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TreatmentPlanCreate(BaseModel):
    assessment_id: uuid.UUID
    title: str
    description: str | None = None
    start_date: date
    end_date: date | None = None
    status: str = "active"


class TreatmentPlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class TreatmentPlanResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    assessment_id: uuid.UUID
    title: str
    description: str | None = None
    start_date: date
    end_date: date | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgressMeasurementCreate(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID | None = None
    treatment_session_id: uuid.UUID | None = None
    assessment_type: AssessmentType | None = None
    measured_at: datetime | None = None
    pain_score: int | None = Field(default=None, ge=0, le=10)
    rom_degrees: int | None = Field(default=None, ge=0, le=360)
    strength_scale: StrengthScale | None = None
    notes: str | None = None


class ProgressMeasurementUpdate(BaseModel):
    pain_score: int | None = Field(default=None, ge=0, le=10)
    rom_degrees: int | None = Field(default=None, ge=0, le=360)
    strength_scale: StrengthScale | None = None
    notes: str | None = None


class ProgressMeasurementResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID | None = None
    treatment_session_id: uuid.UUID | None = None
    assessment_type: AssessmentType | None = None
    measured_at: datetime
    pain_score: int | None = None
    rom_degrees: int | None = None
    strength_scale: StrengthScale | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TrendPoint(BaseModel):
    date: date
    value: float | None = None


class ProgressOverview(BaseModel):
    patient_id: uuid.UUID
    pain_trend: list[TrendPoint]
    rom_trend: list[TrendPoint]
    strength_trend: list[TrendPoint]
    goals: str | None = None
    session_timeline: list[TreatmentSessionResponse]