import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exercises import ExerciseCompletion, ExerciseItem, ExerciseProgram
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class ExerciseProgramRepository(BaseRepository[ExerciseProgram]):
    def __init__(self):
        super().__init__(ExerciseProgram)

    async def get(self, db: AsyncSession, **filters) -> ExerciseProgram | None:
        stmt = select(ExerciseProgram).options(
            selectinload(ExerciseProgram.exercise_items)
        )
        for field, value in filters.items():
            stmt = stmt.where(getattr(ExerciseProgram, field) == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID
    ) -> list[ExerciseProgram]:
        stmt = select(ExerciseProgram).options(
            selectinload(ExerciseProgram.exercise_items)
        ).where(
            ExerciseProgram.patient_id == patient_id,
            ExerciseProgram.is_deleted == False,
        ).order_by(ExerciseProgram.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_all(
        self, db: AsyncSession, *, page: int = 1, size: int = 20
    ) -> PaginatedResponse[ExerciseProgram]:
        stmt = select(ExerciseProgram).options(
            selectinload(ExerciseProgram.exercise_items)
        ).where(ExerciseProgram.is_deleted == False)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(ExerciseProgram.created_at.desc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)


class ExerciseItemRepository(BaseRepository[ExerciseItem]):
    def __init__(self):
        super().__init__(ExerciseItem)

    async def library(
        self, db: AsyncSession, *, category: str | None = None, page: int = 1, size: int = 20
    ) -> PaginatedResponse[ExerciseItem]:
        stmt = select(ExerciseItem).where(ExerciseItem.is_deleted == False)
        if category:
            stmt = stmt.where(ExerciseItem.category == category)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * size).limit(size).order_by(ExerciseItem.exercise_name.asc())
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return paginate(items, total, page, size)


class ExerciseCompletionRepository(BaseRepository[ExerciseCompletion]):
    def __init__(self):
        super().__init__(ExerciseCompletion)

    async def list_for_program(
        self, db: AsyncSession, *, program_id: uuid.UUID, patient_id: uuid.UUID
    ) -> list[ExerciseCompletion]:
        stmt = (
            select(ExerciseCompletion)
            .where(
                ExerciseCompletion.exercise_program_id == program_id,
                ExerciseCompletion.patient_id == patient_id,
            )
            .order_by(ExerciseCompletion.completed_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def distinct_completed_items(
        self, db: AsyncSession, *, program_id: uuid.UUID, patient_id: uuid.UUID
    ) -> set[uuid.UUID | None]:
        stmt = (
            select(ExerciseCompletion.exercise_item_id)
            .where(
                ExerciseCompletion.exercise_program_id == program_id,
                ExerciseCompletion.patient_id == patient_id,
            )
            .distinct()
        )
        result = await db.execute(stmt)
        return set(result.scalars().all())


exercise_program_repo = ExerciseProgramRepository()
exercise_item_repo = ExerciseItemRepository()
exercise_completion_repo = ExerciseCompletionRepository()