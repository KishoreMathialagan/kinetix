import uuid
from datetime import date, datetime, time

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAvailability
from app.repositories.appointment_repository import appointment_repo
from app.repositories.leave_repository import leave_repo


class AvailabilityValidator:
    @staticmethod
    async def validate_time_range(start_time: time, end_time: time, duration_minutes: int) -> None:
        start_dt = datetime.combine(date.today(), start_time)
        end_dt = datetime.combine(date.today(), end_time)
        
        if start_dt >= end_dt:
            raise ValueError("Start time must be before end time.")
            
        diff_minutes = (end_dt - start_dt).total_seconds() / 60
        if diff_minutes != duration_minutes:
            raise ValueError(f"Duration mismatch. Expected {duration_minutes} minutes.")

    @staticmethod
    async def validate_therapist_availability(
        db: AsyncSession, 
        *, 
        therapist_id: uuid.UUID, 
        scheduled_date: date, 
        start_time: time, 
        end_time: time
    ) -> None:
        # Check leave
        leave_conflict = await leave_repo.check_overlap(db, therapist_id=therapist_id, start_date=scheduled_date, end_date=scheduled_date)
        if leave_conflict:
            raise ValueError("Therapist is on leave during this time.")

        # Check working hours
        weekday = scheduled_date.weekday()
        stmt = select(TherapistAvailability).where(
            TherapistAvailability.therapist_id == therapist_id,
            or_(
                TherapistAvailability.specific_date == scheduled_date,
                and_(TherapistAvailability.weekday == weekday, TherapistAvailability.specific_date.is_(None))
            ),
            TherapistAvailability.is_available == True
        )
        result = await db.execute(stmt)
        avail = result.scalars().first()
        
        if not avail:
            raise ValueError("Therapist is not available on this day.")
            
        if start_time < avail.start_time or end_time > avail.end_time:
            raise ValueError("Appointment falls outside therapist working hours.")
            
    @staticmethod
    async def check_conflicts(
        db: AsyncSession,
        *,
        therapist_id: uuid.UUID,
        patient_id: uuid.UUID,
        scheduled_date: date,
        start_time: time,
        end_time: time,
        exclude_appointment_id: uuid.UUID | None = None
    ) -> None:
        # Therapist Double Booking
        if await appointment_repo.check_overlap(
            db, 
            therapist_id=therapist_id, 
            scheduled_date=scheduled_date, 
            start_time=start_time, 
            end_time=end_time,
            exclude_appointment_id=exclude_appointment_id
        ):
            raise ValueError("Therapist has a conflicting appointment.")
            
        # Patient Double Booking
        if await appointment_repo.check_overlap(
            db, 
            patient_id=patient_id, 
            scheduled_date=scheduled_date, 
            start_time=start_time, 
            end_time=end_time,
            exclude_appointment_id=exclude_appointment_id
        ):
            raise ValueError("Patient has a conflicting appointment.")

availability_validator = AvailabilityValidator()
