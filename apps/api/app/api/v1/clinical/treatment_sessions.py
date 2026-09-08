import uuid
from typing import Any,  Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.clinical import TreatmentSession
from app.models.core import User
from app.repositories.clinical_repository import treatment_session_repo
from app.schemas.clinical import (
    TreatmentSessionCreate,
    TreatmentSessionResponse,
    TreatmentSessionUpdate,
)
from app.services.clinical.clinical_service import clinical_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()


@router.get("", summary="List treatment sessions", description="List treatment sessions, optionally filtered by patient.")
async def list_sessions(
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await clinical_service.list_sessions(db, patient_id=patient_id, page=page, size=size)


@router.get("/{id}", response_model=TreatmentSessionResponse, summary="Get treatment session")
async def get_session(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(TreatmentSession, "id")),
    db: AsyncSession = Depends(get_db),
):
    session = await treatment_session_repo.get(db, id=id)
    if not session:
        raise HTTPException(status_code=404, detail="Treatment session not found")
    return session


@router.post("/start", response_model=TreatmentSessionResponse, status_code=status.HTTP_201_CREATED, summary="Start a treatment session")
async def start_session(
    request: TreatmentSessionCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.start_session(
            db,
            appointment_id=request.appointment_id,
            assessment_id=request.assessment_id,
            current_user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{id}/end", response_model=TreatmentSessionResponse, summary="End a treatment session")
async def end_session(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(TreatmentSession, "id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.end_session(db, session_id=id, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id}", response_model=TreatmentSessionResponse, summary="Update treatment session notes")
async def update_session(
    id: uuid.UUID,
    request: TreatmentSessionUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(TreatmentSession, "id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.update_session(
            db, session_id=id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))