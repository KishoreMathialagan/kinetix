import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.core import User
from app.models.profiles import Patient
from app.repositories.base import BaseRepository
from app.schemas.patients.patient import PatientSearchRequest
from app.utils.pagination import PaginatedResponse, paginate


class PatientRepository(BaseRepository[Patient]):
    def __init__(self):
        super().__init__(Patient)

    async def get(self, db: AsyncSession, **filters) -> Patient | None:
        stmt = select(Patient).options(selectinload(Patient.user))
        for field, value in filters.items():
            stmt = stmt.where(getattr(Patient, field) == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self, db: AsyncSession, *, page: int = 1, size: int = 20
    ) -> PaginatedResponse[Patient]:
        stmt = (
            select(Patient)
            .where(Patient.is_deleted == False)
            .options(selectinload(Patient.user))
        )
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(Patient.created_at.desc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)

    async def restore(self, db: AsyncSession, *, patient_id: uuid.UUID) -> Patient | None:
        patient = await db.get(Patient, patient_id)
        if not patient:
            return None
        patient.is_deleted = False
        patient.deleted_at = None
        await db.commit()
        await db.refresh(patient)
        return patient

    async def get_by_user_id(self, db: AsyncSession, *, user_id: uuid.UUID) -> Patient | None:
        stmt = select(Patient).where(Patient.user_id == user_id, Patient.is_deleted == False).options(selectinload(Patient.user))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_patient_code(self, db: AsyncSession, *, patient_code: str) -> Patient | None:
        stmt = select(Patient).where(Patient.patient_code == patient_code, Patient.is_deleted == False)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def search(self, db: AsyncSession, *, search_params: PatientSearchRequest, page: int, size: int) -> PaginatedResponse[Patient]:
        stmt = select(Patient).join(User).where(Patient.is_deleted == False).options(selectinload(Patient.user))
        
        conditions = []
        if search_params.name:
            search_name = f"%{search_params.name}%"
            conditions.append(or_(User.first_name.ilike(search_name), User.last_name.ilike(search_name)))
        if search_params.email:
            conditions.append(User.email.ilike(f"%{search_params.email}%"))
        if search_params.phone:
            conditions.append(User.phone.ilike(f"%{search_params.phone}%"))
        if search_params.gender:
            conditions.append(Patient.gender == search_params.gender)
            
        if conditions:
            stmt = stmt.where(and_(*conditions))
            
        # Count total
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        
        # Paginate
        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        
        return paginate(items, total, page, size)

patient_repo = PatientRepository()
