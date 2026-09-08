from typing import Any
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.patients.consent import ConsentFormResponse, ConsentSignRequest
from app.services.patients.consent_service import consent_service
from app.services.storage import storage_service
from app.utils.pagination import PaginatedResponse

router = APIRouter()


@router.post("/consents/templates", response_model=ConsentFormResponse, status_code=status.HTTP_201_CREATED, summary="Upload a consent template", description="Upload a PDF consent template for a patient (admin only).")
async def upload_template(
    patient_id: uuid.UUID = Form(...),
    template_name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await consent_service.create_template(
            db, patient_id=patient_id, template_name=template_name,
            file=file, current_user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload consent template: {e!s}")


@router.get("/consents", summary="List consent forms", description="List consent forms, optionally filtered by patient.")
async def list_consents(
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await consent_service.list_forms(db, patient_id=patient_id, page=page, size=size)


@router.post("/consents/{form_id}/sign", response_model=ConsentFormResponse, summary="Sign a consent form", description="Sign a consent form by its id.")
async def sign_consent_form(
    form_id: uuid.UUID,
    request: ConsentSignRequest,
    current_user: User = Depends(require_role(["admin", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await consent_service.sign_form_by_id(
            db, form_id=form_id,
            signer_name=request.signer_name,
            signer_role=request.signer_role,
            signature_url=request.signature_url,
            current_user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/consents/{form_id}/pdf", summary="Download a consent form PDF")
async def download_consent_pdf(
    form_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    from app.models.documents import ConsentForm

    form = await db.get(ConsentForm, form_id)
    if not form or not form.pdf_url:
        raise HTTPException(status_code=404, detail="Consent form PDF not found")
    try:
        content = await storage_service.read_file(form.pdf_url)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Consent form PDF file missing")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{form.template_name}.pdf"'},
    )
