import uuid

from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    report_type: str = "patient"
    patient_id: uuid.UUID | None = None
    therapist_id: uuid.UUID | None = None
