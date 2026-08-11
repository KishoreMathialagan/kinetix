from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.clinical import Appointment, TreatmentSession
from app.models.communication import Feedback
from app.models.core import AuditLog, User
from app.models.profiles import Patient, Therapist
from app.schemas.admin import AuditLogResponse
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()


@router.get("/admin/statistics", summary="System statistics", description="High-level system statistics (admin only).")
async def system_statistics(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count()).select_from(User).where(User.is_deleted == False))).scalar() or 0
    total_patients = (await db.execute(select(func.count()).select_from(Patient).where(Patient.is_deleted == False))).scalar() or 0
    total_therapists = (await db.execute(select(func.count()).select_from(Therapist).where(Therapist.is_deleted == False))).scalar() or 0
    total_appointments = (await db.execute(select(func.count()).select_from(Appointment).where(Appointment.is_deleted == False))).scalar() or 0
    total_sessions = (await db.execute(select(func.count()).select_from(TreatmentSession).where(TreatmentSession.is_deleted == False))).scalar() or 0
    avg_rating = (await db.execute(select(func.avg(Feedback.rating)).where(Feedback.is_deleted == False))).scalar()

    return {
        "total_users": int(total_users),
        "total_patients": int(total_patients),
        "total_therapists": int(total_therapists),
        "total_appointments": int(total_appointments),
        "total_treatment_sessions": int(total_sessions),
        "overall_avg_feedback_rating": round(float(avg_rating), 2) if avg_rating is not None else None,
    }


@router.get("/admin/audit-logs", response_model=PaginatedResponse[AuditLogResponse], summary="Audit logs", description="List audit log entries (admin only).")
async def audit_logs(
    user_id=None,
    action: str | None = None,
    entity: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if entity:
        stmt = stmt.where(AuditLog.entity == entity)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.offset((page - 1) * size).limit(size)
    items = list((await db.execute(stmt)).scalars().all())
    return paginate(items, total, page, size)


@router.get("/admin/settings", summary="Get system settings", description="Return application-level settings snapshot (admin only).")
async def get_settings(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    from app.config import settings

    return {
        "app_name": settings.PROJECT_NAME,
        "debug": settings.DEBUG,
        "page_size_default": 20,
    }


@router.put("/admin/settings", summary="Update system settings", description="Placeholder for updating system settings (admin only).")
async def update_settings(
    settings_in: dict,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    from app.config import settings

    return {
        "app_name": settings.PROJECT_NAME,
        "debug": settings.DEBUG,
        "accepted_keys": ["debug"],
        "message": "Settings update is not persisted in this MVP build.",
    }
