from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.clinical import Appointment
from app.models.core import User
from app.models.documents import Report
from app.models.profiles import Patient, Therapist

router = APIRouter()


@router.get("/search", summary="Global search", description="Search patients, therapists, appointments and reports by name, code or type.")
async def global_search(
    q: str = "",
    limit: int = 10,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db),
):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    pattern = f"%{query}%"

    patients_stmt = (
        select(Patient)
        .options(selectinload(Patient.user))
        .join(User, User.id == Patient.user_id)
        .where(
            Patient.is_deleted == False,
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.email.ilike(pattern),
                Patient.patient_code.ilike(pattern),
            ),
        )
        .limit(limit)
    )
    patients = list((await db.execute(patients_stmt)).scalars().all())
    patient_results = [
        {
            "id": p.id,
            "patient_code": p.patient_code,
            "name": f"{p.user.first_name} {p.user.last_name}".strip() if p.user else None,
            "email": p.user.email if p.user else None,
        }
        for p in patients
    ]

    therapists_stmt = (
        select(Therapist)
        .options(selectinload(Therapist.user))
        .join(User, User.id == Therapist.user_id)
        .where(
            Therapist.is_deleted == False,
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.email.ilike(pattern),
                Therapist.license_number.ilike(pattern),
                Therapist.registration_number.ilike(pattern),
                Therapist.specialization.ilike(pattern),
            ),
        )
        .limit(limit)
    )
    therapists = list((await db.execute(therapists_stmt)).scalars().all())
    therapist_results = [
        {
            "id": t.id,
            "license_number": t.license_number,
            "name": f"{t.user.first_name} {t.user.last_name}".strip() if t.user else None,
            "email": t.user.email if t.user else None,
            "specialization": t.specialization,
        }
        for t in therapists
    ]

    appointments_stmt = (
        select(Appointment)
        .where(Appointment.is_deleted == False, Appointment.appointment_type.ilike(pattern))
        .limit(limit)
    )
    appointments = list((await db.execute(appointments_stmt)).scalars().all())
    appointment_results = [
        {"id": a.id, "appointment_type": a.appointment_type, "status": a.status}
        for a in appointments
    ]

    reports_stmt = select(Report).where(Report.report_type.ilike(pattern)).limit(limit)
    reports = list((await db.execute(reports_stmt)).scalars().all())
    report_results = [{"id": r.id, "report_type": r.report_type} for r in reports]

    return {
        "query": query,
        "patients": patient_results,
        "therapists": therapist_results,
        "appointments": appointment_results,
        "reports": report_results,
    }
