import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import DocumentType


class PatientDocumentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    document_type: DocumentType
    file_name: str
    file_url: str
    mime_type: str | None = None
    file_size: int | None = None
    uploaded_by: uuid.UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentVersionCreateRequest(BaseModel):
    note: str | None = None


class DocumentVersionResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version_no: int
    file_name: str
    file_url: str
    mime_type: str | None = None
    file_size: int | None = None
    note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True