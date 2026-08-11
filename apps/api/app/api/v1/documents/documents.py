import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.enums import DocumentType
from app.repositories.document_version_repository import document_version_repo
from app.repositories.patient_document_repository import patient_document_repo
from app.schemas.patients.document import (
    DocumentVersionResponse,
    PatientDocumentResponse,
)
from app.services.patients.patient_document_service import patient_document_service
from app.services.storage import storage_service

router = APIRouter()


@router.get("/documents/{document_id}", summary="Download a patient document")
async def download_document(
    document_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    doc = await patient_document_repo.get(db, id=document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        content = await storage_service.read_file(doc.file_url)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document file missing")
    return Response(
        content=content,
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a patient document")
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    deleted = await patient_document_service.delete_document(
        db, document_id=document_id, current_user_id=current_user.id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/documents/{document_id}/versions", response_model=DocumentVersionResponse, status_code=status.HTTP_201_CREATED, summary="Add a document version", description="Upload a new version of a patient document. The new file becomes the current version.")
async def add_document_version(
    document_id: uuid.UUID,
    file: UploadFile = File(...),
    note: str = Form(default=""),
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await patient_document_service.add_version(
            db, document_id=document_id, file=file,
            note=note or None, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents/{document_id}/versions", response_model=list[DocumentVersionResponse], summary="List document versions", description="List all versions of a document, newest first.")
async def list_document_versions(
    document_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    doc = await patient_document_repo.get(db, id=document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return await patient_document_service.list_versions(db, document_id=document_id)


@router.get("/documents/{document_id}/versions/{version_id}", summary="Download a document version")
async def download_document_version(
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    version = await document_version_repo.get(db, id=version_id)
    if not version or version.document_id != document_id:
        raise HTTPException(status_code=404, detail="Document version not found")
    try:
        content = await storage_service.read_file(version.file_url)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document version file missing")
    return Response(
        content=content,
        media_type=version.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{version.file_name}"'},
    )


@router.delete("/documents/{document_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a document version", description="Delete a historical document version (admin only).")
async def delete_document_version(
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    version = await document_version_repo.get(db, id=version_id)
    if not version or version.document_id != document_id:
        raise HTTPException(status_code=404, detail="Document version not found")
    await patient_document_service.delete_version(
        db, version_id=version_id, current_user_id=current_user.id
    )


@router.post("/documents/bulk", response_model=list[PatientDocumentResponse], status_code=status.HTTP_201_CREATED, summary="Bulk upload documents", description="Upload multiple documents for a patient in a single request.")
async def bulk_upload_documents(
    patient_id: uuid.UUID = Form(...),
    doc_type: DocumentType = Form(...),
    files: list[UploadFile] = File(...),
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role and current_user.role.name == "patient":
        from app.repositories.patient_repository import patient_repo
        actor_patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_patient or actor_patient.id != patient_id:
            raise HTTPException(status_code=403, detail="You can only upload documents for yourself")
    documents = []
    for file in files:
        documents.append(
            await patient_document_service.upload_document(
                db, patient_id=patient_id, file=file, doc_type=doc_type,
                current_user_id=current_user.id
            )
        )
    return documents
