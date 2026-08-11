import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import (
    Appointment,
    Assessment,
    ProgressMeasurement,
    TreatmentPlan,
    TreatmentSession,
)
from app.models.communication import Feedback
from app.models.core import User
from app.models.documents import Report
from app.models.exercises import ExerciseCompletion, ExerciseItem, ExerciseProgram
from app.models.profiles import Patient, Therapist
from app.repositories.feedback_repository import feedback_repo
from app.repositories.patient_repository import patient_repo
from app.repositories.report_repository import report_repo
from app.repositories.therapist_repository import therapist_repo
from app.utils.datetime import utc_now


class ReportService:
    @staticmethod
    async def _status_counts(
        db: AsyncSession, *, patient_id: uuid.UUID | None = None, therapist_id: uuid.UUID | None = None
    ) -> dict[str, int]:
        stmt = select(Appointment.status, func.count()).where(Appointment.is_deleted == False)
        if patient_id:
            stmt = stmt.where(Appointment.patient_id == patient_id)
        if therapist_id:
            stmt = stmt.where(Appointment.therapist_id == therapist_id)
        stmt = stmt.group_by(Appointment.status)
        rows = (await db.execute(stmt)).all()
        return {status: int(count) for status, count in rows}

    async def patient_report(self, db: AsyncSession, *, patient_id: uuid.UUID) -> dict:
        patient = await patient_repo.get(db, id=patient_id)
        if not patient:
            raise ValueError("Patient not found.")
        user = await db.get(User, patient.user_id)

        sessions = list(
            (
                await db.execute(
                    select(TreatmentSession).where(
                        TreatmentSession.patient_id == patient_id,
                        TreatmentSession.is_deleted == False,
                    )
                )
            ).scalars().all()
        )
        completed_sessions = [s for s in sessions if s.end_time is not None]
        avg_pain_before = (
            round(sum(s.pain_before for s in completed_sessions if s.pain_before is not None) / len(completed_sessions), 2)
            if completed_sessions
            else None
        )
        avg_pain_after = (
            round(sum(s.pain_after for s in completed_sessions if s.pain_after is not None) / len(completed_sessions), 2)
            if completed_sessions
            else None
        )

        latest_measurement = (
            await db.execute(
                select(ProgressMeasurement)
                .where(ProgressMeasurement.patient_id == patient_id)
                .order_by(ProgressMeasurement.measured_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        assessments = list(
            (
                await db.execute(
                    select(Assessment).where(
                        Assessment.patient_id == patient_id,
                        Assessment.is_deleted == False,
                    )
                )
            ).scalars().all()
        )
        latest_assessment = assessments[0] if assessments else None

        plans = list(
            (
                await db.execute(
                    select(TreatmentPlan).where(
                        TreatmentPlan.patient_id == patient_id,
                        TreatmentPlan.is_deleted == False,
                    )
                )
            ).scalars().all()
        )

        total_items = (
            await db.execute(
                select(func.count())
                .select_from(ExerciseItem)
                .join(ExerciseProgram, ExerciseItem.exercise_program_id == ExerciseProgram.id)
                .where(
                    ExerciseProgram.patient_id == patient_id,
                    ExerciseProgram.is_deleted == False,
                    ExerciseItem.is_deleted == False,
                )
            )
        ).scalar() or 0
        completed_items = (
            await db.execute(
                select(func.count(func.distinct(ExerciseCompletion.exercise_item_id)))
                .join(ExerciseProgram, ExerciseCompletion.exercise_program_id == ExerciseProgram.id)
                .where(
                    ExerciseProgram.patient_id == patient_id,
                    ExerciseProgram.is_deleted == False,
                    ExerciseCompletion.exercise_item_id.is_not(None),
                )
            )
        ).scalar() or 0

        return {
            "report_type": "patient",
            "generated_at": utc_now().isoformat(),
            "patient": {
                "id": str(patient.id),
                "patient_code": patient.patient_code,
                "name": f"{user.first_name} {user.last_name}".strip() if user else None,
                "email": user.email if user else None,
            },
            "appointments": await self._status_counts(db, patient_id=patient_id),
            "total_sessions": len(sessions),
            "completed_sessions": len(completed_sessions),
            "avg_pain_before": avg_pain_before,
            "avg_pain_after": avg_pain_after,
            "latest_progress_measurement": {
                "pain_score": latest_measurement.pain_score if latest_measurement else None,
                "rom_degrees": latest_measurement.rom_degrees if latest_measurement else None,
                "strength_scale": latest_measurement.strength_scale if latest_measurement else None,
                "measured_at": latest_measurement.measured_at.isoformat() if latest_measurement else None,
            }
            if latest_measurement
            else None,
            "latest_assessment": {
                "assessment_type": latest_assessment.assessment_type if latest_assessment else None,
                "pain_score": latest_assessment.pain_score if latest_assessment else None,
                "diagnosis": latest_assessment.diagnosis if latest_assessment else None,
                "goals": latest_assessment.goals if latest_assessment else None,
            }
            if latest_assessment
            else None,
            "active_treatment_plans": sum(1 for p in plans if p.status == "active"),
            "exercise_compliance": {
                "total_exercise_items": int(total_items),
                "completed_exercise_items": int(completed_items),
                "score": round((completed_items / total_items) * 100, 2) if total_items else 0.0,
            },
        }

    async def therapist_report(self, db: AsyncSession, *, therapist_id: uuid.UUID) -> dict:
        therapist = await therapist_repo.get(db, id=therapist_id)
        if not therapist:
            raise ValueError("Therapist not found.")
        user = await db.get(User, therapist.user_id)

        sessions = list(
            (
                await db.execute(
                    select(TreatmentSession).where(
                        TreatmentSession.therapist_id == therapist_id,
                        TreatmentSession.is_deleted == False,
                    )
                )
            ).scalars().all()
        )

        return {
            "report_type": "therapist",
            "generated_at": utc_now().isoformat(),
            "therapist": {
                "id": str(therapist.id),
                "license_number": therapist.license_number,
                "name": f"{user.first_name} {user.last_name}".strip() if user else None,
                "email": user.email if user else None,
                "specialization": therapist.specialization,
            },
            "appointments": await self._status_counts(db, therapist_id=therapist_id),
            "total_sessions": len(sessions),
            "completed_sessions": sum(1 for s in sessions if s.end_time is not None),
            "avg_rating": await feedback_repo.avg_rating_for_therapist(db, therapist_id=therapist_id),
        }

    async def clinic_report(self, db: AsyncSession) -> dict:
        total_patients = (
            await db.execute(
                select(func.count()).select_from(Patient).where(Patient.is_deleted == False)
            )
        ).scalar() or 0
        total_therapists = (
            await db.execute(
                select(func.count()).select_from(Therapist).where(Therapist.is_deleted == False)
            )
        ).scalar() or 0
        total_sessions = (
            await db.execute(
                select(func.count()).select_from(TreatmentSession).where(TreatmentSession.is_deleted == False)
            )
        ).scalar() or 0
        completed_sessions = (
            await db.execute(
                select(func.count())
                .select_from(TreatmentSession)
                .where(TreatmentSession.is_deleted == False, TreatmentSession.end_time.is_not(None))
            )
        ).scalar() or 0
        total_ratings = (
            await db.execute(
                select(func.avg(Feedback.rating)).where(Feedback.is_deleted == False)
            )
        ).scalar()

        return {
            "report_type": "clinic",
            "generated_at": utc_now().isoformat(),
            "total_patients": int(total_patients),
            "total_therapists": int(total_therapists),
            "appointments": await self._status_counts(db),
            "total_sessions": int(total_sessions),
            "completed_sessions": int(completed_sessions),
            "overall_avg_feedback_rating": round(float(total_ratings), 2) if total_ratings is not None else None,
        }

    async def generate(
        self, db: AsyncSession, *, report_type: str, patient_id: uuid.UUID | None, therapist_id: uuid.UUID | None
    ) -> tuple[Report, dict]:
        if report_type == "patient" and patient_id:
            payload = await self.patient_report(db, patient_id=patient_id)
        elif report_type == "therapist" and therapist_id:
            payload = await self.therapist_report(db, therapist_id=therapist_id)
        elif report_type == "clinic":
            payload = await self.clinic_report(db)
        else:
            raise ValueError("Invalid report_type or missing required id")

        report = Report(
            patient_id=patient_id,
            therapist_id=therapist_id,
            report_type=report_type,
            report_url=f"json://report/{report_type}",
        )
        saved = await report_repo.create(db, obj_in=report)
        return saved, payload


report_service = ReportService()
