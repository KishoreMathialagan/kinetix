import uuid
from datetime import date

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistLeave
from app.repositories.base import BaseRepository


class LeaveRepository(BaseRepository[TherapistLeave]):
    def __init__(self):
        super().__init__(TherapistLeave)

    async def get_by_therapist_id(self, db: AsyncSession, *, therapist_id: uuid.UUID) -> list[TherapistLeave]:
        stmt = select(TherapistLeave).where(TherapistLeave.therapist_id == therapist_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def check_overlap(self, db: AsyncSession, *, therapist_id: uuid.UUID, start_date: date, end_date: date) -> bool:
        stmt = select(TherapistLeave).where(
            TherapistLeave.therapist_id == therapist_id,
            TherapistLeave.status.in_(["pending", "approved"]),
            or_(
                and_(TherapistLeave.start_date <= start_date, TherapistLeave.end_date >= start_date),
                and_(TherapistLeave.start_date <= end_date, TherapistLeave.end_date >= end_date),
                and_(TherapistLeave.start_date >= start_date, TherapistLeave.end_date <= end_date)
            )
        )
        result = await db.execute(stmt)
        return result.first() is not None

leave_repo = LeaveRepository()
