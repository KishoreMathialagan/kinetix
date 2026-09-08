import uuid
from typing import Any,  Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.profiles import Therapist
from app.repositories.therapist_repository import therapist_repo
from app.schemas.therapists.availability import DashboardDTO
from app.schemas.therapists.therapist import (
    TherapistCreate,
    TherapistResponse,
    TherapistUpdate,
)
from app.services.auth.auth_service import auth_service
from app.services.therapists.therapist_service import therapist_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()

@router.get("", summary="Get therapists", description="List all therapists with pagination.")
async def list_therapists(
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await therapist_repo.list_all(db, page=page, size=size)

@router.post("", response_model=TherapistResponse, status_code=status.HTTP_201_CREATED, summary="Register a therapist", description="Register a new therapist (Creates User and Therapist profile transactionally). Admin only.")
async def register_therapist(
    request: TherapistCreate,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        therapist = await therapist_service.register_therapist(db, request=request, current_user_id=current_user.id)
        return therapist
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search", summary="Search therapists", description="Generic search and pagination for therapists.")
async def search_therapists(
    name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    specialization: str | None = None,
    department: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await therapist_repo.search(db, name=name, phone=phone, email=email, specialization=specialization, department=department, page=page, size=size)

@router.get("/{therapist_id}", response_model=TherapistResponse, summary="Get therapist", description="Fetch a specific therapist profile.")
async def get_therapist(
    therapist_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    owner: User = Depends(require_ownership(Therapist, "therapist_id")),
    db: AsyncSession = Depends(get_db)
):
    therapist = await therapist_repo.get(db, id=therapist_id)
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return therapist

@router.put("/{therapist_id}", response_model=TherapistResponse, summary="Update therapist", description="Update a therapist's profile details.")
async def update_therapist(
    therapist_id: uuid.UUID,
    request: TherapistUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    therapist = await therapist_repo.get(db, id=therapist_id)
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    try:
        updated = await therapist_repo.update(db, db_obj=therapist, obj_in=request.model_dump(exclude_unset=True))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update therapist: {exc!s}")
    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="therapist_updated", entity="therapist", entity_id=str(therapist_id)
    )
    return updated

@router.get("/{therapist_id}/dashboard", response_model=DashboardDTO, summary="Get dashboard metrics", description="Lightweight DTO for the therapist dashboard.")
async def get_dashboard(
    therapist_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    # Dummy data until Phase 7
    return DashboardDTO(
        therapist_id=therapist_id,
        todays_appointments_count=0,
        active_patients_count=0,
        availability_status="Available",
        profile_completion_percentage=100.0
    )
