import uuid
from datetime import date
from typing import Any,  Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.permissions import require_permission
from app.dependencies.roles import require_role
from app.models.clinical import Appointment
from app.models.core import User
from app.models.enums import AppointmentStatus
from app.repositories.appointment_repository import appointment_repo
from app.schemas.appointments.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    CancelRequest,
    RescheduleRequest,
)
from app.services.appointments.appointment_service import appointment_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED, summary="Create appointment", description="Transactional appointment booking with conflict detection.")
async def create_appointment(
    request: AppointmentCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "patient"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        return await appointment_service.create_appointment(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", summary="Search appointments", description="Search appointments with filters and pagination.")
async def search_appointments(
    patient_id: uuid.UUID | None = None,
    therapist_id: uuid.UUID | None = None,
    appt_status: AppointmentStatus | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await appointment_repo.search(
        db, patient_id=patient_id, therapist_id=therapist_id, status=appt_status, start_date=start_date, end_date=end_date, page=page, size=size
    )

@router.get("/{id}", response_model=AppointmentResponse, summary="Get appointment", description="Fetch a specific appointment.")
async def get_appointment(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    owner: User = Depends(require_ownership(Appointment, "id")),
    db: AsyncSession = Depends(get_db)
):
    appt = await appointment_repo.get(db, id=id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

@router.patch("/{id}", response_model=AppointmentResponse, summary="Update appointment status", description="Update appointment status ensuring state machine rules.")
async def update_appointment(
    id: uuid.UUID,
    request: AppointmentUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(Appointment, "id")),
    permitted: User = Depends(require_permission("appointment", "update")),
    db: AsyncSession = Depends(get_db)
):
    try:
        if request.status:
            return await appointment_service.update_status(db, appointment_id=id, new_status=request.status, current_user_id=current_user.id, reason=request.notes)
        raise HTTPException(status_code=400, detail="No updates provided.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/reschedule", response_model=AppointmentResponse, summary="Reschedule appointment", description="Reschedules an existing appointment ensuring availability.")
async def reschedule_appointment(
    id: uuid.UUID,
    request: RescheduleRequest,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    owner: User = Depends(require_ownership(Appointment, "id")),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await appointment_service.reschedule(db, appointment_id=id, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/cancel", response_model=AppointmentResponse, summary="Cancel appointment", description="Cancels an appointment.")
async def cancel_appointment(
    id: uuid.UUID,
    request: CancelRequest,
    current_user: User = Depends(require_role(["admin", "patient", "therapist"])),
    owner: User = Depends(require_ownership(Appointment, "id")),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await appointment_service.update_status(db, appointment_id=id, new_status=AppointmentStatus.CANCELLED, current_user_id=current_user.id, reason=request.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{id}/complete", response_model=AppointmentResponse, summary="Complete appointment", description="Marks an appointment as completed.")
async def complete_appointment(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(Appointment, "id")),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await appointment_service.update_status(
            db, appointment_id=id, new_status=AppointmentStatus.COMPLETED,
            current_user_id=current_user.id, reason="Appointment completed",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete appointment", description="Soft delete an appointment.")
async def delete_appointment(
    id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    await appointment_repo.delete(db, id=id)
