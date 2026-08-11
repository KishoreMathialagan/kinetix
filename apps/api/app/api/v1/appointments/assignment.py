import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.permissions import require_permission
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.appointments.assignment import AssignmentRecommendation, AssignTherapistRequest
from app.services.appointments.assignment_service import assignment_service, recommendation_engine

router = APIRouter()

@router.post("/manual", status_code=status.HTTP_201_CREATED, summary="Manual therapist assignment", description="Manually assign a therapist to a patient.")
async def manual_assignment(
    patient_id: uuid.UUID,
    request: AssignTherapistRequest,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    permitted: User = Depends(require_permission("therapist", "assign")),
    db: AsyncSession = Depends(get_db)
):
    try:
        assignment = await assignment_service.manual_assign(db, patient_id=patient_id, request=request, current_user_id=current_user.id)
        return assignment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/recommendations", response_model=list[AssignmentRecommendation], summary="Get therapist recommendations", description="Returns ranked list of therapists for assignment based on rules engine.")
async def get_recommendations(
    patient_id: uuid.UUID,
    required_specialization: str | None = None,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    return await recommendation_engine.get_recommendations(db, patient_id=patient_id, required_specialization=required_specialization)
