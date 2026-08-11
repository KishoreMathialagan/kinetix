import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.profiles import Patient
from app.schemas.patients.consent import ConsentResponse, ConsentSignRequest
from app.services.patients.consent_service import consent_service

router = APIRouter()

@router.post("/{patient_id}/consents", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED, summary="Sign a consent form", description="Attach a signature to a consent form for a patient.")
async def sign_consent(
    patient_id: uuid.UUID,
    request: ConsentSignRequest,
    current_user: User = Depends(require_role(["admin", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db)
):
    return await consent_service.sign_consent(
        db,
        patient_id=patient_id,
        request=request,
        current_user_id=current_user.id
    )

@router.get("/{patient_id}/consents", response_model=list[ConsentResponse], summary="List signed consents")
async def get_consents(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db)
):
    return await consent_service.get_patient_consents(db, patient_id=patient_id)