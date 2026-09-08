from typing import Any
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Feedback
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class FeedbackRepository(BaseRepository[Feedback]):
    def __init__(self):
        super().__init__(Feedback)

    async def list_feedback(
        self,
        db: AsyncSession,
        *,
        patient_id: uuid.UUID | None = None,
        therapist_id: uuid.UUID | None = None,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse[Any]:
        stmt = select(Feedback).where(Feedback.is_deleted == False)
        if patient_id:
            stmt = stmt.where(Feedback.patient_id == patient_id)
        if therapist_id:
            stmt = stmt.where(Feedback.therapist_id == therapist_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(Feedback.created_at.desc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)

    async def avg_rating_for_therapist(self, db: AsyncSession, *, therapist_id: uuid.UUID) -> float:
        stmt = select(func.avg(Feedback.rating)).where(
            Feedback.therapist_id == therapist_id,
            Feedback.is_deleted == False,
        )
        result = (await db.execute(stmt)).scalar()
        return round(float(result), 2) if result is not None else 0.0


feedback_repo = FeedbackRepository()