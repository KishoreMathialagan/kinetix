import uuid
from typing import Any,  Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.profiles import Patient
from app.repositories.patient_repository import patient_repo
from app.schemas.patients.patient import (
    PatientRegistrationRequest,
    PatientResponse,
    PatientSearchRequest,
    PatientUpdateRequest,
)
from app.services.auth.auth_service import auth_service
from app.services.patients.patient_service import patient_management_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()

@router.get("", summary="Get patients", description="List all patients with pagination. Admin and therapist access.")
async def list_patients(
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await patient_repo.list_all(db, page=page, size=size)

@router.get("/{patient_id}", response_model=PatientResponse, summary="Get patient", description="Fetch a specific patient profile.")
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db)
):
    patient = await patient_repo.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=PatientResponse, summary="Update patient", description="Update a patient's profile details.")
async def update_patient(
    patient_id: uuid.UUID,
    request: PatientUpdateRequest,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db)
):
    patient = await patient_repo.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    try:
        updated = await patient_repo.update(db, db_obj=patient, obj_in=request.model_dump(exclude_unset=True))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update patient: {exc!s}")
    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="patient_updated", entity="patient", entity_id=str(patient_id)
    )
    return updated

@router.patch("/{patient_id}/archive", response_model=PatientResponse, summary="Archive patient", description="Archive (soft delete) a patient profile.")
async def archive_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await patient_repo.delete(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="patient_archived", entity="patient", entity_id=str(patient_id)
    )
    return patient

@router.patch("/{patient_id}/restore", response_model=PatientResponse, summary="Restore patient", description="Restore an archived patient profile.")
async def restore_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await patient_repo.restore(db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="patient_restored", entity="patient", entity_id=str(patient_id)
    )
    return patient

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, summary="Register a new patient", description="Registers a new patient and creates their user profile simultaneously.")
async def register_patient(
    request: PatientRegistrationRequest,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        patient = await patient_management_service.register_patient(db, request=request, current_user_id=current_user.id)
        return patient
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/search", summary="Search patients", description="Search patients with generic filters and pagination. Only accessible by admins.")
async def search_patients(
    request: PatientSearchRequest,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await patient_management_service.search_patients(db, search_params=request, page=page, size=size)
