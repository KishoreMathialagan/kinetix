import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import PatientDocument
from app.repositories.base import BaseRepository


class PatientDocumentRepository(BaseRepository[PatientDocument]):
    def __init__(self):
        super().__init__(PatientDocument)

    async def get_by_patient_id(self, db: AsyncSession, *, patient_id: uuid.UUID) -> list[PatientDocument]:
        stmt = select(PatientDocument).where(PatientDocument.patient_id == patient_id, PatientDocument.is_deleted == False)
        result = await db.execute(stmt)
        return list(result.scalars().all())

patient_document_repo = PatientDocumentRepository()
