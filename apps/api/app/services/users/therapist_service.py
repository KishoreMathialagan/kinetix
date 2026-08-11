import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import Therapist
from app.repositories.therapist_repository import therapist_repo
from app.schemas.users.therapist import TherapistCreate, TherapistUpdate
from app.services.auth.auth_service import auth_service


class TherapistService:
    @staticmethod
    async def create_profile(db: AsyncSession, *, user_id: uuid.UUID, profile_in: TherapistCreate) -> Therapist:
        if await therapist_repo.get_by_registration_number(db, registration_number=profile_in.registration_number):
            raise ValueError("Registration number already exists")
            
        obj_in = profile_in.model_dump()
        obj_in["user_id"] = user_id
        
        return await therapist_repo.create(db, obj_in=obj_in)

    @staticmethod
    async def update_profile(db: AsyncSession, *, user_id: uuid.UUID, profile_in: TherapistUpdate) -> Therapist | None:
        therapist = await therapist_repo.get_by_user_id(db, user_id=user_id)
        if not therapist:
            return None
            
        updated = await therapist_repo.update(db, db_obj=therapist, obj_in=profile_in.model_dump(exclude_unset=True))
        
        await auth_service.log_audit_event(
            db, user_id=user_id, action="update_profile", entity="therapist", entity_id=str(therapist.id)
        )
        return updated

    @staticmethod
    async def get_profile(db: AsyncSession, *, user_id: uuid.UUID) -> Therapist | None:
        return await therapist_repo.get_by_user_id(db, user_id=user_id)

therapist_service = TherapistService()
