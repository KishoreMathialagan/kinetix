import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    action: str
    entity: str
    entity_id: str
    created_at: datetime

    class Config:
        from_attributes = True
