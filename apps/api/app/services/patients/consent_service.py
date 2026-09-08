from typing import Any
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import ConsentForm, ConsentSignature
from app.repositories.consent_repository import consent_form_repo, consent_repo
from app.schemas.patients.consent import ConsentSignRequest
from app.services.auth.auth_service import auth_service
from app.services.storage import storage_service
from app.utils.datetime import utc_now
from app.utils.pagination import PaginatedResponse


class ConsentService:
    @staticmethod
    async def create_template(
        db: AsyncSession,
        *,
        patient_id: uuid.UUID,
        template_name: str,
        file: UploadFile,
        current_user_id: uuid.UUID,
    ) -> ConsentForm:
        directory = f"patients/{patient_id}/consents"
        pdf_path = await storage_service.upload_file(file, directory)
        form = ConsentForm(
            patient_id=patient_id,
            template_name=template_name,
            pdf_url=pdf_path,
            created_by=current_user_id,
        )
        saved = await consent_form_repo.create(db, obj_in=form)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="consent_template_uploaded",
            entity="consent_form", entity_id=str(saved.id),
        )
        return saved

    @staticmethod
    async def list_forms(
        db: AsyncSession, *, patient_id: uuid.UUID | None = None, page: int = 1, size: int = 20
    ) -> PaginatedResponse[Any]:
        return await consent_form_repo.list_forms(db, patient_id=patient_id, page=page, size=size)

    @staticmethod
    async def sign_consent(
        db: AsyncSession,
        *,
        patient_id: uuid.UUID,
        request: ConsentSignRequest,
        current_user_id: uuid.UUID
    ) -> ConsentSignature:
        consent_form = await db.get(ConsentForm, request.consent_form_id)
        if not consent_form or consent_form.patient_id != patient_id:
            raise ValueError("Consent form not found for this patient.")

        sig = ConsentSignature(
            consent_form_id=request.consent_form_id,
            signer_name=request.signer_name,
            signer_role=request.signer_role,
            signature_url=request.signature_url,
            signed_at=utc_now(),
        )

        saved_sig = await consent_repo.create(db, obj_in=sig)

        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="consent_signed", entity="consent_signature", entity_id=str(saved_sig.id)
        )
        return saved_sig

    @staticmethod
    async def sign_form_by_id(
        db: AsyncSession,
        *,
        form_id: uuid.UUID,
        signer_name: str,
        signer_role: str,
        signature_url: str,
        current_user_id: uuid.UUID,
    ) -> ConsentForm:
        form = await consent_form_repo.get(db, id=form_id)
        if not form:
            raise ValueError("Consent form not found.")
        form.signed_by = signer_name
        form.signed_at = utc_now()
        form.signature_url = signature_url
        form.updated_by = current_user_id
        try:
            await db.commit()
            await db.refresh(form)
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to sign consent form: {exc!s}")
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="consent_signed", entity="consent_form", entity_id=str(form_id)
        )
        return form

    @staticmethod
    async def get_patient_consents(db: AsyncSession, *, patient_id: uuid.UUID) -> list[ConsentSignature]:
        return await consent_repo.get_by_patient_id(db, patient_id=patient_id)


consent_service = ConsentService()