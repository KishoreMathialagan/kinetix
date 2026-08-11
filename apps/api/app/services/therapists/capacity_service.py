import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAssignment
from app.repositories.therapist_repository import therapist_repo
from app.schemas.therapists.availability import CapacityResponse


class CapacityService:
    @staticmethod
    async def get_therapist_capacity(db: AsyncSession, *, therapist_id: uuid.UUID) -> CapacityResponse:
        therapist = await therapist_repo.get(db, id=therapist_id)
        if not therapist:
            raise ValueError("Therapist not found")
            
        # Get active patients count from assignments
        stmt = select(func.count()).select_from(TherapistAssignment).where(
            TherapistAssignment.therapist_id == therapist_id,
            TherapistAssignment.status == "active",
            TherapistAssignment.is_deleted == False
        )
        active_patients = (await db.execute(stmt)).scalar() or 0
        
        max_capacity = therapist.capacity
        remaining = max(0, max_capacity - active_patients)
        
        # Placeholders for Phase 7
        upcoming_appointments = 0
        availability_score = 100.0 if remaining > 0 else 0.0
        
        return CapacityResponse(
            therapist_id=therapist_id,
            max_capacity=max_capacity,
            active_patients=active_patients,
            remaining_capacity=remaining,
            upcoming_appointments_count=upcoming_appointments,
            availability_score=availability_score
        )

capacity_service = CapacityService()
