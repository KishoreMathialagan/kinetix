from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.users.patient import PatientCreate, PatientProfileResponse, PatientUpdate
from app.services.users.patient_service import patient_service

router = APIRouter()

@router.post("/profile", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    profile_in: PatientCreate,
    current_user: Annotated[User, Depends(require_role(["patient"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        # Generate patient code based on some rules, placeholder for now
        patient_code = f"PT-{current_user.id.hex[:6].upper()}"
        profile = await patient_service.create_profile(db, user_id=current_user.id, patient_code=patient_code, profile_in=profile_in)
        return {"user": current_user, "profile": profile}
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
    return {"user": current_user, "profile": profile}

@router.get("/profile", response_model=PatientProfileResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(require_role(["patient"]))],
    db: AsyncSession = Depends(get_db)
):
    profile = await patient_service.get_profile(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"user": current_user, "profile": profile}
