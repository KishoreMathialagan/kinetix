import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DevicePlatform, NotificationType


class NotificationCreateRequest(BaseModel):
    user_id: uuid.UUID
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    notification_type: NotificationType = NotificationType.IN_APP


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    body: str
    notification_type: str
    read_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DeviceTokenCreateRequest(BaseModel):
    platform: DevicePlatform
    token: str = Field(min_length=10, max_length=512)


class DeviceTokenResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    platform: str
    token: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True