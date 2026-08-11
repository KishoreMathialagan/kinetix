import uuid

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.core import User
from app.models.profiles import Therapist
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class TherapistRepository(BaseRepository[Therapist]):
    def __init__(self):
        super().__init__(Therapist)

    async def get(self, db: AsyncSession, **filters) -> Therapist | None:
        stmt = select(Therapist).options(selectinload(Therapist.user))
        for field, value in filters.items():
            stmt = stmt.where(getattr(Therapist, field) == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self, db: AsyncSession, *, page: int = 1, size: int = 20
    ) -> PaginatedResponse[Therapist]:
        stmt = (
            select(Therapist)
            .where(Therapist.is_deleted == False)
            .options(selectinload(Therapist.user))
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(Therapist.created_at.desc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)

    async def get_by_user_id(self, db: AsyncSession, *, user_id: uuid.UUID) -> Therapist | None:
        stmt = select(Therapist).where(Therapist.user_id == user_id, Therapist.is_deleted == False).options(selectinload(Therapist.user))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_registration_number(self, db: AsyncSession, *, registration_number: str) -> Therapist | None:
        stmt = select(Therapist).where(Therapist.registration_number == registration_number, Therapist.is_deleted == False)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_license_number(self, db: AsyncSession, *, license_number: str) -> Therapist | None:
        stmt = select(Therapist).where(Therapist.license_number == license_number, Therapist.is_deleted == False)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self,
        db: AsyncSession,
        *,
        name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        specialization: str | None = None,
        department: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse[Therapist]:
        stmt = select(Therapist).join(User).where(Therapist.is_deleted == False).options(selectinload(Therapist.user))

        conditions = []
        if name:
            conditions.append(or_(User.first_name.ilike(f"%{name}%"), User.last_name.ilike(f"%{name}%")))
        if phone:
            conditions.append(User.phone.ilike(f"%{phone}%"))
        if email:
            conditions.append(User.email.ilike(f"%{email}%"))
        if specialization:
            conditions.append(Therapist.specialization.ilike(f"%{specialization}%"))
        if department:
            conditions.append(Therapist.department.ilike(f"%{department}%"))

        if conditions:
            stmt = stmt.where(and_(*conditions))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await db.execute(stmt)
        items = list(result.scalars().all())

        return paginate(items, total, page, size)


therapist_repo = TherapistRepository()