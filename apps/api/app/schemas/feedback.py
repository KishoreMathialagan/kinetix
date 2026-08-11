import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreateRequest(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    communication: int | None = Field(default=None, ge=1, le=5)
    professionalism: int | None = Field(default=None, ge=1, le=5)
    treatment_quality: int | None = Field(default=None, ge=1, le=5)
    comments: str | None = None


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID
    rating: int
    communication: int | None = None
    professionalism: int | None = None
    treatment_quality: int | None = None
    comments: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True