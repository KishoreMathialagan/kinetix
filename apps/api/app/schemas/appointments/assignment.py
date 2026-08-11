import uuid

from pydantic import BaseModel


class AssignTherapistRequest(BaseModel):
    therapist_id: uuid.UUID
    is_primary: bool = True
    reason: str | None = None

class AssignmentRecommendation(BaseModel):
    therapist_id: uuid.UUID
    first_name: str
    last_name: str
    specialization: str | None
    score: float
    reasons: list[str]

    class Config:
        from_attributes = True
