from datetime import date

from pydantic import BaseModel

from app.schemas.appointments.appointment import AppointmentSummary


class CalendarDayDTO(BaseModel):
    date: date
    total_appointments: int
    appointments: list[AppointmentSummary]

class CalendarResponse(BaseModel):
    start_date: date
    end_date: date
    total_appointments: int
    days: list[CalendarDayDTO]
