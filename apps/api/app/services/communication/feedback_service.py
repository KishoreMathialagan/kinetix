import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Feedback
from app.repositories.feedback_repository import feedback_repo
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.feedback import FeedbackCreateRequest
from app.services.auth.auth_service import auth_service


class FeedbackService:
    @staticmethod
    async def submit(
        db: AsyncSession, *, request: FeedbackCreateRequest, current_user_id: uuid.UUID
    ) -> Feedback:
        patient = await patient_repo.get(db, id=request.patient_id)
        if not patient:
            raise ValueError("Patient not found.")
        therapist = await therapist_repo.get(db, id=request.therapist_id)
        if not therapist:
            raise ValueError("Therapist not found.")
        if not request.rating:
            raise ValueError("Rating is required.")

        feedback = Feedback(
            patient_id=request.patient_id,
            therapist_id=request.therapist_id,
            rating=request.rating,
            communication=request.communication,
            professionalism=request.professionalism,
            treatment_quality=request.treatment_quality,
            comments=request.comments,
            created_by=current_user_id,
        )
        saved = await feedback_repo.create(db, obj_in=feedback)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="feedback_submitted",
            entity="feedback", entity_id=str(saved.id),
        )
        return saved

    @staticmethod
    async def list_feedback(
        db: AsyncSession,
        *,
        patient_id: uuid.UUID | None = None,
        therapist_id: uuid.UUID | None = None,
        page: int = 1,
        size: int = 20,
    ):
        return await feedback_repo.list_feedback(
            db, patient_id=patient_id, therapist_id=therapist_id, page=page, size=size
        )

    @staticmethod
    async def list_for_therapist(db: AsyncSession, *, therapist_id: uuid.UUID, page: int = 1, size: int = 20):
        return await feedback_repo.list_feedback(db, therapist_id=therapist_id, page=page, size=size)


feedback_service = FeedbackService()