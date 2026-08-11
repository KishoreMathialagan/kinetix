import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.clinical import TreatmentPlan
from app.models.core import User
from app.repositories.clinical_repository import treatment_plan_repo
from app.schemas.clinical import (
    TreatmentPlanCreate,
    TreatmentPlanResponse,
    TreatmentPlanUpdate,
)
from app.services.clinical.clinical_service import clinical_service

router = APIRouter()


@router.get("/{patient_id}/plans", response_model=list[TreatmentPlanResponse], summary="List treatment plans for a patient")
async def list_plans(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await treatment_plan_repo.list_by_patient(db, patient_id=patient_id)


@router.get("/{plan_id}", response_model=TreatmentPlanResponse, summary="Get a treatment plan")
async def get_plan(
    plan_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(TreatmentPlan, "plan_id")),
    db: AsyncSession = Depends(get_db),
):
    plan = await treatment_plan_repo.get(db, id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return plan


@router.post("", response_model=TreatmentPlanResponse, status_code=status.HTTP_201_CREATED, summary="Create a treatment plan")
async def create_plan(
    request: TreatmentPlanCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.create_plan(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{plan_id}", response_model=TreatmentPlanResponse, summary="Update a treatment plan")
async def update_plan(
    plan_id: uuid.UUID,
    request: TreatmentPlanUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(TreatmentPlan, "plan_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.update_plan(
            db, plan_id=plan_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))