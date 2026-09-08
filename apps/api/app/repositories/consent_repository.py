from typing import Any
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import ConsentForm, ConsentSignature
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class ConsentRepository(BaseRepository[ConsentSignature]):
    def __init__(self):
        super().__init__(ConsentSignature)

    async def get_by_patient_id(self, db: AsyncSession, *, patient_id: uuid.UUID) -> list[ConsentSignature]:
        stmt = (
            select(ConsentSignature)
            .join(ConsentForm, ConsentForm.id == ConsentSignature.consent_form_id)
            .where(ConsentForm.patient_id == patient_id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


class ConsentFormRepository(BaseRepository[ConsentForm]):
    def __init__(self):
        super().__init__(ConsentForm)

    async def list_forms(
        self, db: AsyncSession, *, patient_id: uuid.UUID | None = None, page: int = 1, size: int = 20
    ) -> PaginatedResponse[Any]:
        stmt = select(ConsentForm).where(ConsentForm.is_deleted == False)
        if patient_id:
            stmt = stmt.where(ConsentForm.patient_id == patient_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(ConsentForm.created_at.desc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)


consent_form_repo = ConsentFormRepository()

consent_repo = ConsentRepository()
consent_form_repo = ConsentFormRepository()