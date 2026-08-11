import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import (
    Assessment,
    ProgressMeasurement,
    TreatmentPlan,
    TreatmentSession,
)
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class AssessmentRepository(BaseRepository[Assessment]):
    def __init__(self):
        super().__init__(Assessment)

    async def list_by_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID, page: int = 1, size: int = 20
    ) -> PaginatedResponse[Assessment]:
        stmt = select(Assessment).where(
            Assessment.patient_id == patient_id, Assessment.is_deleted == False
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = (
            stmt.order_by(Assessment.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)


class TreatmentSessionRepository(BaseRepository[TreatmentSession]):
    def __init__(self):
        super().__init__(TreatmentSession)

    async def get_by_appointment(
        self, db: AsyncSession, *, appointment_id: uuid.UUID
    ) -> list[TreatmentSession]:
        stmt = select(TreatmentSession).where(
            TreatmentSession.appointment_id == appointment_id,
            TreatmentSession.is_deleted == False,
        ).order_by(TreatmentSession.session_number.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID, page: int = 1, size: int = 20
    ) -> PaginatedResponse[TreatmentSession]:
        stmt = select(TreatmentSession).where(
            TreatmentSession.patient_id == patient_id, TreatmentSession.is_deleted == False
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = (
            stmt.order_by(TreatmentSession.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)


class TreatmentPlanRepository(BaseRepository[TreatmentPlan]):
    def __init__(self):
        super().__init__(TreatmentPlan)

    async def list_by_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID
    ) -> list[TreatmentPlan]:
        stmt = select(TreatmentPlan).where(
            TreatmentPlan.patient_id == patient_id, TreatmentPlan.is_deleted == False
        ).order_by(TreatmentPlan.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())


class ProgressMeasurementRepository(BaseRepository[ProgressMeasurement]):
    def __init__(self):
        super().__init__(ProgressMeasurement)

    async def list_by_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID
    ) -> list[ProgressMeasurement]:
        stmt = select(ProgressMeasurement).where(
            ProgressMeasurement.patient_id == patient_id,
            ProgressMeasurement.is_deleted == False,
        ).order_by(ProgressMeasurement.measured_at.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())


assessment_repo = AssessmentRepository()
treatment_session_repo = TreatmentSessionRepository()
treatment_plan_repo = TreatmentPlanRepository()
progress_measurement_repo = ProgressMeasurementRepository()