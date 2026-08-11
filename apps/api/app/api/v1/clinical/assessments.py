import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.permissions import require_permission
from app.dependencies.roles import require_role
from app.models.clinical import Assessment
from app.models.core import User
from app.models.enums import AssessmentType
from app.schemas.clinical import AssessmentCreate, AssessmentResponse, AssessmentUpdate
from app.services.clinical.clinical_service import clinical_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AssessmentResponse], summary="List assessments", description="List assessments, optionally filtered by patient.")
async def list_assessments(
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await clinical_service.list_assessments(db, patient_id=patient_id, page=page, size=size)


@router.get("/{id}", response_model=AssessmentResponse, summary="Get assessment")
async def get_assessment(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Assessment, "id")),
    db: AsyncSession = Depends(get_db),
):
    assessment = await clinical_service.get_assessment(db, assessment_id=id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED, summary="Create an assessment")
async def create_assessment(
    request: AssessmentCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    permitted: User = Depends(require_permission("assessment", "create")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.create_assessment(
            db, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


async def _create_typed_assessment(
    db: AsyncSession,
    request: AssessmentCreate,
    current_user: User,
    assessment_type: AssessmentType,
):
    request = request.model_copy(update={"assessment_type": assessment_type})
    try:
        return await clinical_service.create_assessment(
            db, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/initial", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED, summary="Create an initial assessment")
async def create_initial_assessment(
    request: AssessmentCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    permitted: User = Depends(require_permission("assessment", "create")),
    db: AsyncSession = Depends(get_db),
):
    return await _create_typed_assessment(db, request, current_user, AssessmentType.INITIAL)


@router.post("/weekly", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED, summary="Create a weekly assessment")
async def create_weekly_assessment(
    request: AssessmentCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    permitted: User = Depends(require_permission("assessment", "create")),
    db: AsyncSession = Depends(get_db),
):
    return await _create_typed_assessment(db, request, current_user, AssessmentType.WEEKLY)


@router.post("/final", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED, summary="Create a final assessment")
async def create_final_assessment(
    request: AssessmentCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    permitted: User = Depends(require_permission("assessment", "create")),
    db: AsyncSession = Depends(get_db),
):
    return await _create_typed_assessment(db, request, current_user, AssessmentType.FINAL)


@router.put("/{id}", response_model=AssessmentResponse, summary="Update an assessment")
async def update_assessment(
    id: uuid.UUID,
    request: AssessmentUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(Assessment, "id")),
    permitted: User = Depends(require_permission("assessment", "update")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.update_assessment(
            db, assessment_id=id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))