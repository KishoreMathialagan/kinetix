import uuid
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.appointment_repository import appointment_repo
from app.schemas.appointments.appointment import AppointmentSummary
from app.schemas.appointments.calendar import CalendarDayDTO, CalendarResponse


class CalendarService:
    async def get_calendar(
        self,
        db: AsyncSession,
        *,
        start_date: date,
        end_date: date,
        therapist_id: uuid.UUID | None = None,
        patient_id: uuid.UUID | None = None
    ) -> CalendarResponse:
        
        appointments = await appointment_repo.get_by_date_range(
            db, start_date=start_date, end_date=end_date, therapist_id=therapist_id, patient_id=patient_id
        )
        
        # Group by date
        grouped = defaultdict(list)
        for appt in appointments:
            summary = AppointmentSummary(
                id=appt.id,
                patient_id=appt.patient_id,
                therapist_id=appt.therapist_id,
                scheduled_date=appt.scheduled_date,
                start_time=appt.start_time,
                end_time=appt.end_time,
                duration_minutes=appt.duration_minutes or 0,
                appointment_type=appt.appointment_type,
                status=appt.status
            )
            grouped[appt.scheduled_date].append(summary)
            
        days = []
        current_date = start_date
        while current_date <= end_date:
            day_appts = grouped.get(current_date, [])
            days.append(
                CalendarDayDTO(
                    date=current_date,
                    total_appointments=len(day_appts),
                    appointments=day_appts
                )
            )
            current_date += timedelta(days=1)
            
        return CalendarResponse(
            start_date=start_date,
            end_date=end_date,
            total_appointments=len(appointments),
            days=days
        )

calendar_service = CalendarService()
