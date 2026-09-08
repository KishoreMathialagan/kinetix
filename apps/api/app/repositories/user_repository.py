import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.core import Role, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, *, email: str) -> User | None:
        stmt = (
            select(User)
            .where(User.email == email, User.is_deleted == False)
            .options(
                selectinload(User.role).selectinload(Role.permissions),
                selectinload(User.patient),
                selectinload(User.therapist),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone(self, db: AsyncSession, *, phone: str) -> User | None:
        stmt = select(User).where(User.phone == phone, User.is_deleted == False)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_with_role(self, db: AsyncSession, *, id: uuid.UUID) -> User | None:
        stmt = (
            select(User)
            .where(User.id == id, User.is_deleted == False)
            .options(
                selectinload(User.role).selectinload(Role.permissions),
                selectinload(User.patient),
                selectinload(User.therapist),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

user_repo = UserRepository()
