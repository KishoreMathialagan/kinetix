import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAvailability
from app.repositories.base import BaseRepository


class AvailabilityRepository(BaseRepository[TherapistAvailability]):
    def __init__(self):
        super().__init__(TherapistAvailability)

    async def get_by_therapist_id(self, db: AsyncSession, *, therapist_id: uuid.UUID) -> list[TherapistAvailability]:
        stmt = select(TherapistAvailability).where(TherapistAvailability.therapist_id == therapist_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())
        
    async def get_recurring_availability(self, db: AsyncSession, *, therapist_id: uuid.UUID) -> list[TherapistAvailability]:
        stmt = select(TherapistAvailability).where(
            TherapistAvailability.therapist_id == therapist_id,
            TherapistAvailability.specific_date.is_(None)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_date_overrides(self, db: AsyncSession, *, therapist_id: uuid.UUID, start_date: date, end_date: date) -> list[TherapistAvailability]:
        stmt = select(TherapistAvailability).where(
            TherapistAvailability.therapist_id == therapist_id,
            TherapistAvailability.specific_date.is_not(None),
            TherapistAvailability.specific_date >= start_date,
            TherapistAvailability.specific_date <= end_date
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

availability_repo = AvailabilityRepository()
