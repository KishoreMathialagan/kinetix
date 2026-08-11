
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.core import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self):
        super().__init__(Role)

    async def get_by_name(self, db: AsyncSession, *, name: str) -> Role | None:
        stmt = select(Role).where(Role.name == name, Role.is_deleted == False).options(selectinload(Role.permissions))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

role_repo = RoleRepository()
