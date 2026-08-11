
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.billing import Invoice, Payment
from app.models.clinical import Appointment, TreatmentSession
from app.models.communication import Feedback, Notification
from app.models.core import User
from app.models.exercises import ExerciseProgram
from app.models.profiles import Patient, Therapist, TherapistAssignment
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.utils.datetime import utc_now

router = APIRouter()


@router.get("/dashboard/admin", summary="Admin dashboard", description="High-level clinic statistics (admin only).")
async def admin_dashboard(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    total_patients = (
        await db.execute(select(func.count()).select_from(Patient).where(Patient.is_deleted == False))
    ).scalar() or 0
    total_therapists = (
        await db.execute(select(func.count()).select_from(Therapist).where(Therapist.is_deleted == False))
    ).scalar() or 0
    total_appointments = (
        await db.execute(select(func.count()).select_from(Appointment).where(Appointment.is_deleted == False))
    ).scalar() or 0
    upcoming_appointments = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(Appointment.is_deleted == False, Appointment.status.in_(["scheduled", "confirmed"]))
        )
    ).scalar() or 0
    completed_sessions = (
        await db.execute(
            select(func.count())
            .select_from(TreatmentSession)
            .where(TreatmentSession.is_deleted == False, TreatmentSession.end_time.is_not(None))
        )
    ).scalar() or 0
    avg_rating = (await db.execute(select(func.avg(Feedback.rating)).where(Feedback.is_deleted == False))).scalar()

    billed = (
        await db.execute(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(
                Invoice.is_deleted == False,
                Invoice.status.notin_(["draft", "cancelled"]),
            )
        )
    ).scalar() or 0
    collected = (
        await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.is_deleted == False, Payment.status == "completed"
            )
        )
    ).scalar() or 0
    invoice_count = (
        await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.is_deleted == False,
                Invoice.status.notin_(["draft", "cancelled"]),
            )
        )
    ).scalar() or 0

    return {
        "total_patients": int(total_patients),
        "total_therapists": int(total_therapists),
        "total_appointments": int(total_appointments),
        "upcoming_appointments": int(upcoming_appointments),
        "completed_sessions": int(completed_sessions),
        "overall_avg_feedback_rating": round(float(avg_rating), 2) if avg_rating is not None else None,
        "revenue": {
            "total_billed": round(float(billed), 2),
            "total_collected": round(float(collected), 2),
            "outstanding": round(float(billed) - float(collected), 2),
            "total_invoices": int(invoice_count),
            "avg_invoice_value": round(float(billed) / int(invoice_count), 2) if int(invoice_count) else None,
        },
    }


@router.get("/dashboard/admin/analytics", summary="Admin revenue analytics", description="Operational analytics: revenue KPIs and therapist productivity (admin only).")
async def admin_analytics(
    days: int = 30,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    days = max(1, min(days, 365))
    since = utc_now() - timedelta(days=days)

    billed = (
        await db.execute(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(
                Invoice.is_deleted == False,
                Invoice.status.notin_(["draft", "cancelled"]),
                Invoice.issued_at.is_not(None),
                Invoice.issued_at >= since,
            )
        )
    ).scalar() or 0
    collected = (
        await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.is_deleted == False,
                Payment.status == "completed",
                Payment.paid_at.is_not(None),
                Payment.paid_at >= since,
            )
        )
    ).scalar() or 0
    invoice_count = (
        await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.is_deleted == False,
                Invoice.status.notin_(["draft", "cancelled"]),
                Invoice.issued_at.is_not(None),
                Invoice.issued_at >= since,
            )
        )
    ).scalar() or 0

    productivity_rows = (
        await db.execute(
            select(Therapist.id, Therapist.user_id, func.count(TreatmentSession.id))
            .outerjoin(
                TreatmentSession,
                (TreatmentSession.therapist_id == Therapist.id)
                & (TreatmentSession.is_deleted == False),
            )
            .where(Therapist.is_deleted == False)
            .group_by(Therapist.id, Therapist.user_id)
            .order_by(func.count(TreatmentSession.id).desc())
            .limit(5)
        )
    ).all()

    from app.models.core import User as UserModel

    top_therapists = []
    for therapist_id, user_id, session_count in productivity_rows:
        user = await db.get(UserModel, user_id)
        active_patients = (
            await db.execute(
                select(func.count())
                .select_from(TherapistAssignment)
                .where(
                    TherapistAssignment.therapist_id == therapist_id,
                    TherapistAssignment.status == "active",
                )
            )
        ).scalar() or 0
        top_therapists.append(
            {
                "therapist_id": str(therapist_id),
                "name": f"{user.first_name} {user.last_name}".strip() if user else None,
                "completed_sessions": int(session_count),
                "active_patients": int(active_patients),
            }
        )

    return {
        "range_days": days,
        "revenue": {
            "billed": round(float(billed), 2),
            "collected": round(float(collected), 2),
            "outstanding": round(float(billed) - float(collected), 2),
            "invoice_count": int(invoice_count),
            "avg_invoice_value": round(float(billed) / int(invoice_count), 2) if int(invoice_count) else None,
        },
        "therapist_productivity": top_therapists,
    }


@router.get("/dashboard/therapist", summary="Therapist dashboard", description="Stats for the current therapist.")
async def therapist_dashboard(
    current_user: User = Depends(require_role(["therapist", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist profile not found")
    appointments = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(Appointment.therapist_id == therapist.id, Appointment.is_deleted == False)
        )
    ).scalar() or 0
    upcoming = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(
                Appointment.therapist_id == therapist.id,
                Appointment.is_deleted == False,
                Appointment.status.in_(["scheduled", "confirmed"]),
            )
        )
    ).scalar() or 0
    sessions = (
        await db.execute(
            select(func.count())
            .select_from(TreatmentSession)
            .where(TreatmentSession.therapist_id == therapist.id, TreatmentSession.is_deleted == False)
        )
    ).scalar() or 0
    active_programs = (
        await db.execute(
            select(func.count())
            .select_from(ExerciseProgram)
            .where(ExerciseProgram.therapist_id == therapist.id, ExerciseProgram.is_deleted == False)
        )
    ).scalar() or 0
    avg_rating = (
        await db.execute(
            select(func.avg(Feedback.rating)).where(
                Feedback.therapist_id == therapist.id, Feedback.is_deleted == False
            )
        )
    ).scalar()

    return {
        "therapist_id": str(therapist.id),
        "total_appointments": int(appointments),
        "upcoming_appointments": int(upcoming),
        "total_sessions": int(sessions),
        "active_exercise_programs": int(active_programs),
        "avg_feedback_rating": round(float(avg_rating), 2) if avg_rating is not None else None,
    }


@router.get("/dashboard/patient", summary="Patient dashboard", description="Stats for the current patient.")
async def patient_dashboard(
    current_user: User = Depends(require_role(["patient", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    appointments = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(Appointment.patient_id == patient.id, Appointment.is_deleted == False)
        )
    ).scalar() or 0
    upcoming = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(
                Appointment.patient_id == patient.id,
                Appointment.is_deleted == False,
                Appointment.status.in_(["scheduled", "confirmed"]),
            )
        )
    ).scalar() or 0
    sessions = (
        await db.execute(
            select(func.count())
            .select_from(TreatmentSession)
            .where(TreatmentSession.patient_id == patient.id, TreatmentSession.is_deleted == False)
        )
    ).scalar() or 0
    programs = (
        await db.execute(
            select(func.count())
            .select_from(ExerciseProgram)
            .where(ExerciseProgram.patient_id == patient.id, ExerciseProgram.is_deleted == False)
        )
    ).scalar() or 0
    unread = (
        await db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False,
                Notification.read_at.is_(None),
            )
        )
    ).scalar() or 0

    assigned_therapist = None
    assignment = (
        await db.execute(
            select(TherapistAssignment)
            .where(
                TherapistAssignment.patient_id == patient.id,
                TherapistAssignment.status == "active",
                TherapistAssignment.is_deleted == False,
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if assignment:
        therapist = await db.get(Therapist, assignment.therapist_id)
        if therapist:
            therapist_user = await db.get(User, therapist.user_id)
            assigned_therapist = {
                "therapist_id": str(therapist.id),
                "name": f"{therapist_user.first_name} {therapist_user.last_name}".strip() if therapist_user else None,
                "specialization": therapist.specialization,
            }

    return {
        "patient_id": str(patient.id),
        "total_appointments": int(appointments),
        "upcoming_appointments": int(upcoming),
        "total_sessions": int(sessions),
        "exercise_programs": int(programs),
        "unread_notifications": int(unread),
        "assigned_therapist": assigned_therapist,
    }
