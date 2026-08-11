import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import DocumentVersion, PatientDocument
from app.models.enums import DocumentType
from app.repositories.document_version_repository import document_version_repo
from app.repositories.patient_document_repository import patient_document_repo
from app.services.auth.auth_service import auth_service
from app.services.storage import storage_service


class PatientDocumentService:
    @staticmethod
    async def upload_document(
        db: AsyncSession,
        *,
        patient_id: uuid.UUID,
        file: UploadFile,
        doc_type: DocumentType,
        current_user_id: uuid.UUID
    ) -> PatientDocument:
        # Upload using the abstract storage service
        directory = f"patients/{patient_id}/documents"
        storage_path = await storage_service.upload_file(file, directory)

        # Save metadata
        doc = PatientDocument(
            patient_id=patient_id,
            uploaded_by=current_user_id,
            document_type=doc_type,
            file_name=file.filename or "",
            file_url=storage_path,
            mime_type=file.content_type,
            file_size=None,
            created_by=current_user_id
        )

        saved_doc = await patient_document_repo.create(db, obj_in=doc)
        await document_version_repo.create(
            db,
            obj_in=DocumentVersion(
                document_id=saved_doc.id,
                version_no=1,
                file_name=file.filename or "",
                file_url=storage_path,
                mime_type=file.content_type,
                file_size=None,
                created_by=current_user_id,
            ),
        )

        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="document_uploaded", entity="patient_document", entity_id=str(saved_doc.id)
        )
        return saved_doc

    @staticmethod
    async def get_patient_documents(db: AsyncSession, *, patient_id: uuid.UUID) -> list[PatientDocument]:
        return await patient_document_repo.get_by_patient_id(db, patient_id=patient_id)

    @staticmethod
    async def delete_document(db: AsyncSession, *, document_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
        doc = await patient_document_repo.get(db, id=document_id)
        if not doc:
            return False

        # Delete file
        await storage_service.delete_file(doc.file_url)

        # Delete record
        await patient_document_repo.delete(db, id=document_id)

        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="document_deleted", entity="patient_document", entity_id=str(document_id)
        )
        return True

    @staticmethod
    async def add_version(
        db: AsyncSession, *, document_id: uuid.UUID, file: UploadFile,
        note: str | None, current_user_id: uuid.UUID
    ) -> DocumentVersion:
        doc = await patient_document_repo.get(db, id=document_id)
        if not doc:
            raise ValueError("Document not found.")
        version_no = await document_version_repo.next_version_no(db, document_id=document_id)
        directory = f"patients/{doc.patient_id}/documents/versions"
        storage_path = await storage_service.upload_file(file, directory)

        version = DocumentVersion(
            document_id=document_id,
            version_no=version_no,
            file_name=file.filename or doc.file_name,
            file_url=storage_path,
            mime_type=file.content_type or doc.mime_type,
            file_size=None,
            note=note,
            created_by=current_user_id,
        )
        saved = await document_version_repo.create(db, obj_in=version)

        doc.file_url = storage_path
        doc.file_name = file.filename or doc.file_name
        doc.mime_type = file.content_type or doc.mime_type
        await db.commit()

        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="document_version_added",
            entity="patient_document", entity_id=str(document_id),
        )
        return saved

    @staticmethod
    async def list_versions(db: AsyncSession, *, document_id: uuid.UUID) -> list[DocumentVersion]:
        return await document_version_repo.list_for_document(db, document_id=document_id)

    @staticmethod
    async def delete_version(db: AsyncSession, *, version_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
        version = await document_version_repo.get(db, id=version_id)
        if not version:
            return False
        await storage_service.delete_file(version.file_url)
        await document_version_repo.delete(db, id=version_id)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="document_version_deleted",
            entity="document_version", entity_id=str(version_id),
        )
        return True

patient_document_service = PatientDocumentService()
