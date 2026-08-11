import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.enums import DocumentType
from app.models.profiles import Patient
from app.schemas.patients.document import PatientDocumentResponse
from app.services.patients.patient_document_service import patient_document_service

router = APIRouter()

@router.post("/{patient_id}/documents", response_model=PatientDocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload a patient document")
async def upload_document(
    patient_id: uuid.UUID,
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    current_user: User = Depends(require_role(["admin", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await patient_document_service.upload_document(
            db,
            patient_id=patient_id,
            file=file,
            doc_type=doc_type,
            current_user_id=current_user.id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload document")

@router.get("/{patient_id}/documents", response_model=list[PatientDocumentResponse], summary="Get patient documents")
async def get_documents(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db)
):
    return await patient_document_service.get_patient_documents(db, patient_id=patient_id)