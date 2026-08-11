import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import Patient
from app.repositories.patient_repository import patient_repo
from app.schemas.users.patient import PatientCreate, PatientUpdate
from app.services.auth.auth_service import auth_service


class PatientService:
    @staticmethod
    async def create_profile(db: AsyncSession, *, user_id: uuid.UUID, patient_code: str, profile_in: PatientCreate) -> Patient:
        if await patient_repo.get_by_patient_code(db, patient_code=patient_code):
            raise ValueError("Patient code already exists")
            
        obj_in = profile_in.model_dump()
        obj_in["user_id"] = user_id
        obj_in["patient_code"] = patient_code
        
        return await patient_repo.create(db, obj_in=obj_in)

    @staticmethod
    async def update_profile(db: AsyncSession, *, user_id: uuid.UUID, profile_in: PatientUpdate) -> Patient | None:
        patient = await patient_repo.get_by_user_id(db, user_id=user_id)
        if not patient:
            return None
            
        updated = await patient_repo.update(db, db_obj=patient, obj_in=profile_in.model_dump(exclude_unset=True))
        
        await auth_service.log_audit_event(
            db, user_id=user_id, action="update_profile", entity="patient", entity_id=str(patient.id)
        )
        return updated

    @staticmethod
    async def get_profile(db: AsyncSession, *, user_id: uuid.UUID) -> Patient | None:
        return await patient_repo.get_by_user_id(db, user_id=user_id)

patient_service = PatientService()
