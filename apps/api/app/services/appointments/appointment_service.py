import uuid
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import Appointment, AppointmentHistory
from app.models.enums import AppointmentStatus
from app.repositories.appointment_repository import appointment_repo
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.appointments.appointment import (
    AppointmentCreate,
    RescheduleRequest,
)
from app.services.appointments.availability_validator import availability_validator
from app.services.auth.auth_service import auth_service


class AppointmentService:
    async def _create_history(self, db: AsyncSession, appointment_id: uuid.UUID, new_status: AppointmentStatus, user_id: uuid.UUID, old_status: AppointmentStatus | None = None, reason: str | None = None):
        history = AppointmentHistory(
            appointment_id=appointment_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=user_id,
            reason=reason
        )
        db.add(history)

    async def create_appointment(self, db: AsyncSession, *, request: AppointmentCreate, current_user_id: uuid.UUID) -> Appointment:
        # Validate patient and therapist exist
        if not await patient_repo.get(db, id=request.patient_id):
            raise ValueError("Patient not found.")
        if not await therapist_repo.get(db, id=request.therapist_id):
            raise ValueError("Therapist not found.")

        end_time = (datetime.combine(request.scheduled_date, request.start_time) + timedelta(minutes=request.duration_minutes)).time()

        await availability_validator.validate_time_range(request.start_time, end_time, request.duration_minutes)
        await availability_validator.validate_therapist_availability(
            db, therapist_id=request.therapist_id, scheduled_date=request.scheduled_date, start_time=request.start_time, end_time=end_time
        )
        await availability_validator.check_conflicts(
            db, therapist_id=request.therapist_id, patient_id=request.patient_id, scheduled_date=request.scheduled_date, start_time=request.start_time, end_time=end_time
        )
        
        try:
            appointment = Appointment(
                patient_id=request.patient_id,
                therapist_id=request.therapist_id,
                scheduled_date=request.scheduled_date,
                start_time=request.start_time,
                end_time=end_time,
                duration_minutes=request.duration_minutes,
                appointment_type=request.appointment_type,
                address=request.address,
                notes=request.notes,
                status=AppointmentStatus.SCHEDULED,
                created_by=current_user_id
            )
            db.add(appointment)
            await db.flush()
            
            await self._create_history(db, appointment.id, AppointmentStatus.SCHEDULED, current_user_id, reason="Initial booking")
            await auth_service.log_audit_event(db, user_id=current_user_id, action="appointment_created", entity="appointment", entity_id=str(appointment.id))
            
            await db.commit()
            await db.refresh(appointment)
            return appointment
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to create appointment: {e!s}")

    async def update_status(self, db: AsyncSession, *, appointment_id: uuid.UUID, new_status: AppointmentStatus, current_user_id: uuid.UUID, reason: str | None = None) -> Appointment:
        appointment = await appointment_repo.get(db, id=appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
            
        old_status = appointment.status
        
        # State machine validations
        valid_transitions = {
            AppointmentStatus.SCHEDULED: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED],
            AppointmentStatus.CONFIRMED: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED],
            AppointmentStatus.IN_PROGRESS: [AppointmentStatus.COMPLETED]
        }
        
        if new_status not in valid_transitions.get(old_status, []):
            raise ValueError(f"Invalid transition from {old_status} to {new_status}")
            
        try:
            appointment.status = new_status
            if reason and new_status == AppointmentStatus.CANCELLED:
                appointment.cancellation_reason = reason
                
            await self._create_history(db, appointment.id, new_status, current_user_id, old_status, reason)
            await auth_service.log_audit_event(db, user_id=current_user_id, action=f"appointment_status_changed_{new_status.value}", entity="appointment", entity_id=str(appointment.id))
            
            await db.commit()
            await db.refresh(appointment)
            return appointment
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to update appointment: {e!s}")
            
    async def reschedule(self, db: AsyncSession, *, appointment_id: uuid.UUID, request: RescheduleRequest, current_user_id: uuid.UUID) -> Appointment:
        appointment = await appointment_repo.get(db, id=appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
            
        if appointment.status not in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]:
            raise ValueError("Only SCHEDULED or CONFIRMED appointments can be rescheduled.")
            
        end_time = (datetime.combine(request.scheduled_date, request.start_time) + timedelta(minutes=request.duration_minutes)).time()
        
        await availability_validator.validate_time_range(request.start_time, end_time, request.duration_minutes)
        await availability_validator.validate_therapist_availability(
            db, therapist_id=appointment.therapist_id, scheduled_date=request.scheduled_date, start_time=request.start_time, end_time=end_time
        )
        await availability_validator.check_conflicts(
            db, therapist_id=appointment.therapist_id, patient_id=appointment.patient_id,
            scheduled_date=request.scheduled_date, start_time=request.start_time, end_time=end_time,
            exclude_appointment_id=appointment.id
        )

        try:
            old_status = appointment.status
            appointment.scheduled_date = request.scheduled_date
            appointment.start_time = request.start_time
            appointment.end_time = end_time
            appointment.duration_minutes = request.duration_minutes

            # Rescheduling moves the timeslot without changing the appointment status.
            await self._create_history(db, appointment.id, old_status, current_user_id, old_status, request.reason or "Rescheduled")
            await auth_service.log_audit_event(db, user_id=current_user_id, action="appointment_rescheduled", entity="appointment", entity_id=str(appointment.id))
            
            await db.commit()
            await db.refresh(appointment)
            return appointment
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to reschedule appointment: {e!s}")

appointment_service = AppointmentService()
