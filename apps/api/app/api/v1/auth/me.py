from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.core import User
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.auth import UserMeResponse

router = APIRouter()


@router.get("/me", response_model=UserMeResponse, summary="Get current user profile", description="Returns the authenticated user's profile and linked patient/therapist ids.")
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    role_name = current_user.role.name if current_user.role else None
    patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
    therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        role=role_name,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        patient_id=patient.id if patient else None,
        therapist_id=therapist.id if therapist else None,
        created_at=current_user.created_at,
    )