import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    async def get(
        self, db: AsyncSession, id: uuid.UUID, load_options: list | None = None
    ) -> ModelType | None:
        stmt = select(self.model).where(self.model.id == id)
        
        # Add a condition for soft delete if the model supports it
        if hasattr(self.model, "is_deleted"):
            stmt = stmt.where(self.model.is_deleted == False)

        if load_options:
            for option in load_options:
                stmt = stmt.options(option)

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> list[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        
        if hasattr(self.model, "is_deleted"):
            stmt = stmt.where(self.model.is_deleted == False)
            
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self, db: AsyncSession, *, obj_in: dict[str, Any] | ModelType
    ) -> ModelType:
        if isinstance(obj_in, dict):
            db_obj = self.model(**obj_in)
        elif isinstance(obj_in, self.model):
            db_obj = obj_in
        else:
            raise TypeError(
                f"obj_in must be a dict or a {self.model.__name__} instance, got {type(obj_in).__name__}"
            )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: uuid.UUID) -> ModelType:
        obj = await db.get(self.model, id)
        if obj:
            if hasattr(obj, "is_deleted"):
                # Soft delete
                obj.is_deleted = True
                if hasattr(obj, "deleted_at"):
                    from datetime import datetime
                    obj.deleted_at = datetime.utcnow()
                db.add(obj)
            else:
                # Hard delete
                await db.delete(obj)
            await db.commit()
        return obj
