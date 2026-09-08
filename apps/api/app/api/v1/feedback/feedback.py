from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.repositories.patient_repository import patient_repo
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.services.communication.feedback_service import feedback_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit feedback", description="Submit feedback for a therapist. Patients can only submit feedback about themselves.")
async def submit_feedback(
    request: FeedbackCreateRequest,
    current_user: User = Depends(require_role(["admin", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role and current_user.role.name == "patient":
        actor_patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_patient or actor_patient.id != request.patient_id:
            raise HTTPException(status_code=403, detail="You can only submit feedback for yourself")
    try:
        return await feedback_service.submit(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/feedback", summary="Get feedback", description="List feedback with optional patient/therapist filters.")
async def list_feedback(
    patient_id: uuid.UUID | None = None,
    therapist_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await feedback_service.list_feedback(
        db, patient_id=patient_id, therapist_id=therapist_id, page=page, size=size
    )


@router.get("/feedback/therapist/{therapist_id}", summary="Get therapist feedback", description="List all feedback for a therapist.")
async def therapist_feedback(
    therapist_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await feedback_service.list_for_therapist(
        db, therapist_id=therapist_id, page=page, size=size
    )
