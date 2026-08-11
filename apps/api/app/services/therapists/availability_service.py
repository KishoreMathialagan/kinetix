import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAvailability, TherapistLeave
from app.repositories.availability_repository import availability_repo
from app.repositories.leave_repository import leave_repo
from app.schemas.therapists.availability import AvailabilityCreate, LeaveRequest
from app.services.auth.auth_service import auth_service


class AvailabilityService:
    @staticmethod
    async def list_availability(db: AsyncSession, *, therapist_id: uuid.UUID) -> list[TherapistAvailability]:
        return await availability_repo.get_by_therapist_id(db, therapist_id=therapist_id)

    @staticmethod
    async def update_availability(
        db: AsyncSession, *, therapist_id: uuid.UUID, availability_id: uuid.UUID,
        request: AvailabilityCreate, current_user_id: uuid.UUID,
    ) -> TherapistAvailability:
        avail = await availability_repo.get(db, id=availability_id)
        if not avail or avail.therapist_id != therapist_id:
            raise ValueError("Availability not found for this therapist")
        updated = await availability_repo.update(
            db, db_obj=avail, obj_in=request.model_dump(exclude_unset=True)
        )
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="availability_updated",
            entity="therapist_availability", entity_id=str(availability_id),
        )
        return updated

    @staticmethod
    async def add_availability(db: AsyncSession, *, therapist_id: uuid.UUID, request: AvailabilityCreate, current_user_id: uuid.UUID) -> TherapistAvailability:
        # Validate overlap would go here
        
        avail = TherapistAvailability(
            therapist_id=therapist_id,
            weekday=request.weekday,
            specific_date=request.specific_date,
            start_time=request.start_time,
            end_time=request.end_time,
            is_available=request.is_available,
            reason=request.reason
        )
        
        saved = await availability_repo.create(db, obj_in=avail)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="availability_updated", entity="therapist_availability", entity_id=str(saved.id)
        )
        return saved

    @staticmethod
    async def request_leave(db: AsyncSession, *, therapist_id: uuid.UUID, request: LeaveRequest, current_user_id: uuid.UUID) -> TherapistLeave:
        if await leave_repo.check_overlap(db, therapist_id=therapist_id, start_date=request.start_date, end_date=request.end_date):
            raise ValueError("Leave dates overlap with an existing pending or approved request.")
            
        leave = TherapistLeave(
            therapist_id=therapist_id,
            leave_type=request.leave_type,
            reason=request.reason,
            start_date=request.start_date,
            end_date=request.end_date,
            status="pending"
        )
        
        saved = await leave_repo.create(db, obj_in=leave)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="leave_requested", entity="therapist_leave", entity_id=str(saved.id)
        )
        return saved

availability_service = AvailabilityService()
