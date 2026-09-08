from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.core import User
from app.schemas.auth import UserMeResponse
from app.services.patient_profile_check import check_patient_profile_complete

router = APIRouter()


@router.get("/me", response_model=UserMeResponse, summary="Get current user profile", description="Returns the authenticated user's profile and linked patient/therapist ids.")
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    patient_id = None
    therapist_id = None
    profile_completed = True
    missing_fields: list[str] = []

    if current_user.patient:
        patient_id = current_user.patient.id
        profile_completed, missing_fields = check_patient_profile_complete(current_user.patient)
    elif current_user.therapist:
        therapist_id = current_user.therapist.id

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        role=current_user.role.name if current_user.role else None,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        patient_id=patient_id,
        therapist_id=therapist_id,
        profile_completed=profile_completed,
        missing_fields=missing_fields,
        created_at=current_user.created_at,
    )
