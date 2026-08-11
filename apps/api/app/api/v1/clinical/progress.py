import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.clinical import ProgressMeasurement
from app.models.core import User
from app.models.profiles import Patient
from app.repositories.clinical_repository import progress_measurement_repo
from app.schemas.clinical import (
    ProgressMeasurementCreate,
    ProgressMeasurementResponse,
    ProgressMeasurementUpdate,
    ProgressOverview,
)
from app.services.clinical.clinical_service import clinical_service
from app.services.clinical.progress_service import progress_service

router = APIRouter()


@router.get("/patients/{patient_id}/progress", response_model=ProgressOverview, summary="Get patient progress overview", description="Aggregates pain/ROM/strength trends, goals and the session timeline for a patient.")
async def get_patient_progress(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db),
):
    return await progress_service.get_overview(db, patient_id=patient_id)


@router.get("/patients/{patient_id}/progress/measurements", response_model=list[ProgressMeasurementResponse], summary="List progress measurements for a patient")
async def list_measurements(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db),
):
    return await progress_measurement_repo.list_by_patient(db, patient_id=patient_id)


@router.post("/progress/measurements", response_model=ProgressMeasurementResponse, status_code=status.HTTP_201_CREATED, summary="Create a progress measurement")
async def create_measurement(
    request: ProgressMeasurementCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.create_measurement(
            db, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/progress/measurements/{measurement_id}", response_model=ProgressMeasurementResponse, summary="Update a progress measurement")
async def update_measurement(
    measurement_id: uuid.UUID,
    request: ProgressMeasurementUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ProgressMeasurement, "measurement_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await clinical_service.update_measurement(
            db, measurement_id=measurement_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))