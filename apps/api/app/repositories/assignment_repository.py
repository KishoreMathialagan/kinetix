import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAssignment
from app.repositories.base import BaseRepository


class AssignmentRepository(BaseRepository[TherapistAssignment]):
    def __init__(self):
        super().__init__(TherapistAssignment)

    async def get_by_patient_and_therapist(self, db: AsyncSession, *, patient_id: uuid.UUID, therapist_id: uuid.UUID) -> TherapistAssignment | None:
        stmt = select(TherapistAssignment).where(
            TherapistAssignment.patient_id == patient_id,
            TherapistAssignment.therapist_id == therapist_id,
            TherapistAssignment.is_deleted == False
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_patient(self, db: AsyncSession, *, patient_id: uuid.UUID) -> list[TherapistAssignment]:
        stmt = select(TherapistAssignment).where(
            TherapistAssignment.patient_id == patient_id,
            TherapistAssignment.status == "active",
            TherapistAssignment.is_deleted == False
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

assignment_repo = AssignmentRepository()
