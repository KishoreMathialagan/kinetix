from typing import Any
import uuid
from datetime import date, time

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import Appointment
from app.models.enums import AppointmentStatus
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self):
        super().__init__(Appointment)

    async def check_overlap(
        self, 
        db: AsyncSession, 
        *, 
        therapist_id: uuid.UUID | None = None, 
        patient_id: uuid.UUID | None = None, 
        scheduled_date: date, 
        start_time: time, 
        end_time: time,
        exclude_appointment_id: uuid.UUID | None = None
    ) -> bool:
        conditions = [
            Appointment.scheduled_date == scheduled_date,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]),
            Appointment.is_deleted == False,
            or_(
                and_(Appointment.start_time <= start_time, Appointment.end_time > start_time),
                and_(Appointment.start_time < end_time, Appointment.end_time >= end_time),
                and_(Appointment.start_time >= start_time, Appointment.end_time <= end_time)
            )
        ]
        
        if therapist_id:
            conditions.append(Appointment.therapist_id == therapist_id)
        if patient_id:
            conditions.append(Appointment.patient_id == patient_id)
        if exclude_appointment_id:
            conditions.append(Appointment.id != exclude_appointment_id)
            
        stmt = select(Appointment).where(and_(*conditions))
        result = await db.execute(stmt)
        return result.first() is not None

    async def search(
        self, 
        db: AsyncSession, 
        *, 
        patient_id: uuid.UUID | None = None,
        therapist_id: uuid.UUID | None = None,
        status: AppointmentStatus | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        page: int = 1, 
        size: int = 20
    ) -> PaginatedResponse[Any]:
        stmt = select(Appointment).where(Appointment.is_deleted == False)
        
        conditions = []
        if patient_id:
            conditions.append(Appointment.patient_id == patient_id)
        if therapist_id:
            conditions.append(Appointment.therapist_id == therapist_id)
        if status:
            conditions.append(Appointment.status == status)
        if start_date:
            conditions.append(Appointment.scheduled_date >= start_date)
        if end_date:
            conditions.append(Appointment.scheduled_date <= end_date)
            
        if conditions:
            stmt = stmt.where(and_(*conditions))
            
        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(Appointment.scheduled_date.asc(), Appointment.start_time.asc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        
        return paginate(items, total, page, size)

    async def get_by_date_range(self, db: AsyncSession, *, start_date: date, end_date: date, therapist_id: uuid.UUID | None = None, patient_id: uuid.UUID | None = None) -> list[Appointment]:
        conditions = [
            Appointment.scheduled_date >= start_date,
            Appointment.scheduled_date <= end_date,
            Appointment.is_deleted == False
        ]
        if therapist_id:
            conditions.append(Appointment.therapist_id == therapist_id)
        if patient_id:
            conditions.append(Appointment.patient_id == patient_id)
            
        stmt = select(Appointment).where(and_(*conditions)).order_by(Appointment.scheduled_date.asc(), Appointment.start_time.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

appointment_repo = AppointmentRepository()
