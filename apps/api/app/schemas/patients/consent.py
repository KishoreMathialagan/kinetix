import uuid
from datetime import datetime

from pydantic import BaseModel


class ConsentSignRequest(BaseModel):
    consent_form_id: uuid.UUID
    signer_name: str
    signer_role: str
    signature_url: str  # Storage path or serialized signature data


class ConsentResponse(BaseModel):
    id: uuid.UUID
    consent_form_id: uuid.UUID
    signer_name: str
    signer_role: str
    signature_url: str
    signed_at: datetime | None = None

    class Config:
        from_attributes = True


class ConsentFormResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    template_name: str
    signed_by: str | None = None
    signed_at: datetime | None = None
    signature_url: str | None = None
    pdf_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True