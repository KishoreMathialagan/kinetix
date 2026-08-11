from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.users.therapist import TherapistCreate, TherapistProfileResponse, TherapistUpdate
from app.services.users.therapist_service import therapist_service

router = APIRouter()

@router.post("/profile", response_model=TherapistProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    profile_in: TherapistCreate,
    current_user: Annotated[User, Depends(require_role(["therapist"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        profile = await therapist_service.create_profile(db, user_id=current_user.id, profile_in=profile_in)
        return {"user": current_user, "profile": profile}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profile", response_model=TherapistProfileResponse)
async def update_my_profile(
    profile_in: TherapistUpdate,
    current_user: Annotated[User, Depends(require_role(["therapist"]))],
    db: AsyncSession = Depends(get_db)
):
    profile = await therapist_service.update_profile(db, user_id=current_user.id, profile_in=profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"user": current_user, "profile": profile}

@router.get("/profile", response_model=TherapistProfileResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(require_role(["therapist"]))],
    db: AsyncSession = Depends(get_db)
):
    profile = await therapist_service.get_profile(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"user": current_user, "profile": profile}
