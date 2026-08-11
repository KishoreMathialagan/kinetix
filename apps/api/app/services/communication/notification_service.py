import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Notification
from app.models.enums import NotificationType
from app.repositories.communication_repository import device_token_repo, notification_repo
from app.services.communication.email_service import send_email
from app.services.communication.push_service import send_push


class NotificationService:
    @staticmethod
    async def notify(
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        title: str,
        body: str,
        notification_type: NotificationType = NotificationType.IN_APP,
        email_address: str | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            read_at=None,
        )
        saved = await notification_repo.create(db, obj_in=notification)

        if notification_type == NotificationType.EMAIL and email_address:
            await send_email(email_address, title, body)
        elif notification_type == NotificationType.PUSH:
            tokens = await device_token_repo.list_for_user(db, user_id=user_id)
            await send_push(
                user_id,
                title,
                body,
                device_tokens=[t.token for t in tokens if t.is_active],
            )
        return saved


notification_service = NotificationService()
