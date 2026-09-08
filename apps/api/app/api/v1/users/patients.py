from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.users.patient import PatientCreate, PatientProfileResponse, PatientUpdate
from app.services.patient_profile_check import check_patient_profile_complete
from app.services.users.patient_service import patient_service

router = APIRouter()


def _profile_response(user, profile):
    profile_completed = True
    missing_fields: list[str] = []
    if profile:
        profile_completed, missing_fields = check_patient_profile_complete(profile)
    return {
        "user": user,
        "profile": profile,
        "profile_completed": profile_completed,
        "missing_fields": missing_fields,
    }


@router.post("/profile", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    profile_in: PatientCreate,
    current_user: Annotated[User, Depends(require_role(["patient"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        patient_code = f"PT-{current_user.id.hex[:6].upper()}"
        profile = await patient_service.create_profile(db, user_id=current_user.id, patient_code=patient_code, profile_in=profile_in)
        return _profile_response(current_user, profile)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profile", response_model=PatientProfileResponse)
async def update_my_profile(
    profile_in: PatientUpdate,
    current_user: Annotated[User, Depends(require_role(["patient"]))],
    db: AsyncSession = Depends(get_db)
):
    profile = await patient_service.update_profile(db, user_id=current_user.id, profile_in=profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _profile_response(current_user, profile)

@router.get("/profile", response_model=PatientProfileResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(require_role(["patient"]))],
    db: AsyncSession = Depends(get_db)
):
    profile = await patient_service.get_profile(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _profile_response(current_user, profile)
