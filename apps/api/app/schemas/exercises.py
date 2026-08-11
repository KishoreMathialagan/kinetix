import uuid
from datetime import datetime

from pydantic import BaseModel


class ExerciseItemCreate(BaseModel):
    exercise_name: str
    category: str | None = None
    repetitions: int | None = None
    sets: int | None = None
    duration: str | None = None
    image_url: str | None = None
    video_url: str | None = None


class ExerciseItemUpdate(BaseModel):
    exercise_name: str | None = None
    category: str | None = None
    repetitions: int | None = None
    sets: int | None = None
    duration: str | None = None
    image_url: str | None = None
    video_url: str | None = None


class ExerciseItemResponse(BaseModel):
    id: uuid.UUID
    exercise_program_id: uuid.UUID
    exercise_name: str
    category: str | None = None
    repetitions: int | None = None
    sets: int | None = None
    duration: str | None = None
    image_url: str | None = None
    video_url: str | None = None

    class Config:
        from_attributes = True


class ExerciseProgramCreate(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID | None = None
    title: str
    instructions: str | None = None
    frequency: str | None = None
    duration: str | None = None
    items: list[ExerciseItemCreate] = []


class ExerciseProgramUpdate(BaseModel):
    title: str | None = None
    instructions: str | None = None
    frequency: str | None = None
    duration: str | None = None


class ExerciseProgramResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    title: str
    instructions: str | None = None
    frequency: str | None = None
    duration: str | None = None
    exercise_items: list[ExerciseItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CheckInCreate(BaseModel):
    exercise_item_id: uuid.UUID | None = None
    notes: str | None = None


class CheckInResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    exercise_program_id: uuid.UUID
    exercise_item_id: uuid.UUID | None = None
    completed_at: datetime
    notes: str | None = None

    class Config:
        from_attributes = True


class ComplianceResponse(BaseModel):
    exercise_program_id: uuid.UUID
    patient_id: uuid.UUID
    title: str
    expected_count: int
    completed_count: int
    score: float
    completions: list[CheckInResponse] = []

    class Config:
        from_attributes = True