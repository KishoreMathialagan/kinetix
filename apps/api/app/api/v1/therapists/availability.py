import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.therapists.availability import (
    AvailabilityCreate,
    AvailabilityResponse,
    CapacityResponse,
    LeaveRequest,
    LeaveResponse,
)
from app.services.therapists.availability_service import availability_service
from app.services.therapists.capacity_service import capacity_service

router = APIRouter()

@router.post("/{therapist_id}/availability", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED, summary="Add availability", description="Adds recurring or date-specific availability.")
async def add_availability(
    therapist_id: uuid.UUID,
    request: AvailabilityCreate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    return await availability_service.add_availability(db, therapist_id=therapist_id, request=request, current_user_id=current_user.id)

@router.get("/{therapist_id}/availability", response_model=list[AvailabilityResponse], summary="Get therapist availability", description="List all availability slots for a therapist.")
async def get_availability(
    therapist_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db)
):
    return await availability_service.list_availability(db, therapist_id=therapist_id)

@router.put("/{therapist_id}/availability", response_model=AvailabilityResponse, summary="Update therapist availability", description="Update an availability slot.")
async def update_availability(
    therapist_id: uuid.UUID,
    availability_id: uuid.UUID,
    request: AvailabilityCreate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await availability_service.update_availability(
            db, therapist_id=therapist_id, availability_id=availability_id,
            request=request, current_user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{therapist_id}/leave", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED, summary="Request leave", description="Request time off for a therapist.")
async def request_leave(
    therapist_id: uuid.UUID,
    request: LeaveRequest,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await availability_service.request_leave(db, therapist_id=therapist_id, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{therapist_id}/capacity", response_model=CapacityResponse, summary="Get therapist capacity", description="Fetch current active patients and capacity limits.")
async def get_capacity(
    therapist_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await capacity_service.get_therapist_capacity(db, therapist_id=therapist_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
