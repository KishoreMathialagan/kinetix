
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import Report
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report]):
    def __init__(self):
        super().__init__(Report)

    async def get(self, db: AsyncSession, **filters) -> Report | None:
        return await super().get(db, **filters)


report_repo = ReportRepository()
