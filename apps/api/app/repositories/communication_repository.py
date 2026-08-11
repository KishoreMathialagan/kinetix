import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import DeviceToken, Notification
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    async def list_for_user(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse[Notification]:
        stmt = select(Notification).where(
            Notification.user_id == user_id, Notification.is_deleted == False
        )
        if unread_only:
            stmt = stmt.where(Notification.read_at.is_(None))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = (
            stmt.order_by(Notification.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)

    async def count_unread(self, db: AsyncSession, *, user_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_deleted == False,
            Notification.read_at.is_(None),
        )
        return (await db.execute(stmt)).scalar() or 0

    async def mark_all_read(self, db: AsyncSession, *, user_id: uuid.UUID) -> int:
        stmt = (
            Notification.__table__.update()
            .where(
                Notification.user_id == user_id,
                Notification.is_deleted == False,
                Notification.read_at.is_(None),
            )
            .values(read_at=func.now())
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount or 0


notification_repo = NotificationRepository()


class DeviceTokenRepository(BaseRepository[DeviceToken]):
    def __init__(self):
        super().__init__(DeviceToken)

    async def get_by_token(self, db: AsyncSession, *, token: str) -> DeviceToken | None:
        stmt = select(DeviceToken).where(
            DeviceToken.token == token, DeviceToken.is_deleted == False
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> list[DeviceToken]:
        stmt = (
            select(DeviceToken)
            .where(DeviceToken.user_id == user_id, DeviceToken.is_deleted == False)
            .order_by(DeviceToken.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


device_token_repo = DeviceTokenRepository()