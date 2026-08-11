import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import DocumentVersion
from app.repositories.base import BaseRepository


class DocumentVersionRepository(BaseRepository[DocumentVersion]):
    def __init__(self):
        super().__init__(DocumentVersion)

    async def list_for_document(
        self, db: AsyncSession, *, document_id: uuid.UUID
    ) -> list[DocumentVersion]:
        stmt = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_no.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def next_version_no(self, db: AsyncSession, *, document_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.max(DocumentVersion.version_no), 0)).where(
            DocumentVersion.document_id == document_id
        )
        return int((await db.execute(stmt)).scalar() or 0) + 1


document_version_repo = DocumentVersionRepository()
