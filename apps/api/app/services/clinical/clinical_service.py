import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import (
    Assessment,
    ProgressMeasurement,
    TreatmentPlan,
    TreatmentSession,
)
from app.repositories.appointment_repository import appointment_repo
from app.repositories.clinical_repository import (
    assessment_repo,
    progress_measurement_repo,
    treatment_plan_repo,
    treatment_session_repo,
)
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.clinical import (
    AssessmentCreate,
    AssessmentUpdate,
    ProgressMeasurementCreate,
    ProgressMeasurementUpdate,
    TreatmentPlanCreate,
    TreatmentPlanUpdate,
    TreatmentSessionUpdate,
)
from app.services.auth.auth_service import auth_service
from app.services.communication.notification_service import notification_service
from app.utils.datetime import utc_now
from app.utils.pagination import PaginatedResponse, paginate


class ClinicalService:
    async def _next_session_number(
        self, db: AsyncSession, *, appointment_id: uuid.UUID
    ) -> int:
        sessions = await treatment_session_repo.get_by_appointment(
            db, appointment_id=appointment_id
        )
        numbers = [s.session_number or 0 for s in sessions]
        return max(numbers, default=0) + 1

    async def create_assessment(
        self, db: AsyncSession, *, request: AssessmentCreate, current_user_id: uuid.UUID
    ) -> Assessment:
        appointment = await appointment_repo.get(db, id=request.appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")
        if appointment.patient_id != request.patient_id:
            raise ValueError("Appointment does not belong to the given patient.")
        if appointment.therapist_id != request.therapist_id:
            raise ValueError("Appointment does not belong to the given therapist.")

        try:
            assessment = Assessment(
                patient_id=request.patient_id,
                therapist_id=request.therapist_id,
                appointment_id=request.appointment_id,
                assessment_type=request.assessment_type,
                pain_score=request.pain_score,
                diagnosis=request.diagnosis,
                findings=request.findings,
                goals=request.goals,
                recommendations=request.recommendations,
                created_by=current_user_id,
            )
            db.add(assessment)
            await db.flush()
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="assessment_created",
                entity="assessment", entity_id=str(assessment.id),
            )
            await db.commit()
            await db.refresh(assessment)
            return assessment
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to create assessment: {exc!s}")

    async def update_assessment(
        self, db: AsyncSession, *, assessment_id: uuid.UUID,
        request: AssessmentUpdate, current_user_id: uuid.UUID
    ) -> Assessment:
        assessment = await assessment_repo.get(db, id=assessment_id)
        if not assessment:
            raise ValueError("Assessment not found.")
        try:
            updated = await assessment_repo.update(
                db, db_obj=assessment, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="assessment_updated",
                entity="assessment", entity_id=str(assessment_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update assessment: {exc!s}")

    async def get_assessment(
        self, db: AsyncSession, *, assessment_id: uuid.UUID
    ) -> Assessment | None:
        return await assessment_repo.get(db, id=assessment_id)

    async def list_assessments(
        self, db: AsyncSession, *, patient_id: uuid.UUID | None, page: int, size: int
    ) -> PaginatedResponse[Assessment]:
        if patient_id:
            return await assessment_repo.list_by_patient(
                db, patient_id=patient_id, page=page, size=size
            )
        results = await assessment_repo.get_multi(db, skip=(page - 1) * size, limit=size)
        return paginate(results, len(results), page, size)

    async def start_session(
        self, db: AsyncSession, *, appointment_id: uuid.UUID,
        assessment_id: uuid.UUID | None, current_user_id: uuid.UUID
    ) -> TreatmentSession:
        appointment = await appointment_repo.get(db, id=appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")
        if appointment.status not in ("confirmed", "scheduled", "in_progress"):
            raise ValueError("Only booked appointments can start treatment sessions.")

        session_number = await self._next_session_number(db, appointment_id=appointment_id)

        patient = await patient_repo.get(db, id=appointment.patient_id)

        try:
            session = TreatmentSession(
                patient_id=appointment.patient_id,
                therapist_id=appointment.therapist_id,
                appointment_id=appointment.id,
                assessment_id=assessment_id,
                session_number=session_number,
                start_time=utc_now(),
                created_by=current_user_id,
            )
            db.add(session)
            await db.flush()
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="treatment_session_started",
                entity="treatment_session", entity_id=str(session.id),
            )
            if patient:
                await notification_service.notify(
                    db,
                    user_id=patient.user_id,
                    title="Treatment session started",
                    body=f"Your treatment session #{session_number} has started.",
                )
            await db.commit()
            await db.refresh(session)
            return session
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to start session: {exc!s}")

    async def end_session(
        self, db: AsyncSession, *, session_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> TreatmentSession:
        session = await treatment_session_repo.get(db, id=session_id)
        if not session:
            raise ValueError("Treatment session not found.")
        if session.end_time is not None:
            raise ValueError("Treatment session already ended.")

        try:
            session.end_time = utc_now()
            db.add(session)
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="treatment_session_ended",
                entity="treatment_session", entity_id=str(session.id),
            )
            await db.commit()
            await db.refresh(session)
            return session
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to end session: {exc!s}")

    async def update_session(
        self, db: AsyncSession, *, session_id: uuid.UUID,
        request: TreatmentSessionUpdate, current_user_id: uuid.UUID
    ) -> TreatmentSession:
        session = await treatment_session_repo.get(db, id=session_id)
        if not session:
            raise ValueError("Treatment session not found.")
        try:
            updated = await treatment_session_repo.update(
                db, db_obj=session, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="treatment_session_updated",
                entity="treatment_session", entity_id=str(session_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update session: {exc!s}")

    async def list_sessions(
        self, db: AsyncSession, *, patient_id: uuid.UUID | None, page: int, size: int
    ) -> PaginatedResponse[TreatmentSession]:
        if patient_id:
            return await treatment_session_repo.list_by_patient(
                db, patient_id=patient_id, page=page, size=size
            )
        results = await treatment_session_repo.get_multi(db, skip=(page - 1) * size, limit=size)
        return paginate(results, len(results), page, size)

    async def create_plan(
        self, db: AsyncSession, *, request: TreatmentPlanCreate, current_user_id: uuid.UUID
    ) -> TreatmentPlan:
        assessment = await assessment_repo.get(db, id=request.assessment_id)
        if not assessment:
            raise ValueError("Assessment not found.")
        try:
            plan = TreatmentPlan(
                patient_id=assessment.patient_id,
                therapist_id=assessment.therapist_id,
                assessment_id=assessment.id,
                title=request.title,
                description=request.description,
                start_date=request.start_date,
                end_date=request.end_date,
                status=request.status,
                created_by=current_user_id,
            )
            db.add(plan)
            await db.flush()
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="treatment_plan_created",
                entity="treatment_plan", entity_id=str(plan.id),
            )
            await db.commit()
            await db.refresh(plan)
            return plan
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to create plan: {exc!s}")

    async def update_plan(
        self, db: AsyncSession, *, plan_id: uuid.UUID,
        request: TreatmentPlanUpdate, current_user_id: uuid.UUID
    ) -> TreatmentPlan:
        plan = await treatment_plan_repo.get(db, id=plan_id)
        if not plan:
            raise ValueError("Treatment plan not found.")
        try:
            updated = await treatment_plan_repo.update(
                db, db_obj=plan, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="treatment_plan_updated",
                entity="treatment_plan", entity_id=str(plan_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update plan: {exc!s}")

    async def create_measurement(
        self, db: AsyncSession, *, request: ProgressMeasurementCreate, current_user_id: uuid.UUID
    ) -> ProgressMeasurement:
        if not await patient_repo.get(db, id=request.patient_id):
            raise ValueError("Patient not found.")
        actor_therapist = await self._user_therapist_id(db, current_user_id)
        try:
            measurement = ProgressMeasurement(
                patient_id=request.patient_id,
                therapist_id=request.therapist_id or actor_therapist,
                treatment_session_id=request.treatment_session_id,
                assessment_type=request.assessment_type,
                measured_at=request.measured_at or utc_now(),
                pain_score=request.pain_score,
                rom_degrees=request.rom_degrees,
                strength_scale=request.strength_scale,
                notes=request.notes,
                created_by=current_user_id,
            )
            db.add(measurement)
            await db.flush()
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="progress_measurement_created",
                entity="progress_measurement", entity_id=str(measurement.id),
            )
            await db.commit()
            await db.refresh(measurement)
            return measurement
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to create measurement: {exc!s}")

    async def update_measurement(
        self, db: AsyncSession, *, measurement_id: uuid.UUID,
        request: ProgressMeasurementUpdate, current_user_id: uuid.UUID
    ) -> ProgressMeasurement:
        measurement = await progress_measurement_repo.get(db, id=measurement_id)
        if not measurement:
            raise ValueError("Progress measurement not found.")
        try:
            updated = await progress_measurement_repo.update(
                db, db_obj=measurement, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="progress_measurement_updated",
                entity="progress_measurement", entity_id=str(measurement_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update measurement: {exc!s}")

    @staticmethod
    async def _user_therapist_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID | None:
        therapist = await therapist_repo.get_by_user_id(db, user_id=user_id)
        return therapist.id if therapist else None


clinical_service = ClinicalService()