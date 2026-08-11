import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.models.core import User
from app.repositories.user_repository import user_repo
from app.schemas.users.user import UserCreate, UserUpdate
from app.services.auth.auth_service import auth_service


class UserService:
    @staticmethod
    async def create_user(db: AsyncSession, *, user_in: UserCreate) -> User:
        # Check if email/phone exists
        if await user_repo.get_by_email(db, email=user_in.email):
            raise ValueError("Email already registered")
        if user_in.phone and await user_repo.get_by_phone(db, phone=user_in.phone):
            raise ValueError("Phone already registered")
            
        obj_in = user_in.model_dump(exclude={"password"})
        obj_in["password_hash"] = pwd_context.hash(user_in.password)
        
        return await user_repo.create(db, obj_in=obj_in)

    @staticmethod
    async def update_user(db: AsyncSession, *, user_id: uuid.UUID, user_in: UserUpdate, current_user_id: uuid.UUID) -> User | None:
        user = await user_repo.get(db, id=user_id)
        if not user:
            return None
            
        if (
            user_in.phone
            and user_in.phone != user.phone
            and await user_repo.get_by_phone(db, phone=user_in.phone)
        ):
            raise ValueError("Phone already registered")
                
        updated_user = await user_repo.update(db, db_obj=user, obj_in=user_in.model_dump(exclude_unset=True))
        
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="update", entity="user", entity_id=str(user.id)
        )
        return updated_user

    @staticmethod
    async def reset_password(db: AsyncSession, *, user: User, new_password: str) -> User:
        return await user_repo.update(db, db_obj=user, obj_in={"password_hash": pwd_context.hash(new_password)})

    @staticmethod
    async def get_user(db: AsyncSession, *, user_id: uuid.UUID) -> User | None:
        return await user_repo.get(db, id=user_id)
        
    @staticmethod
    async def list_users(db: AsyncSession, *, skip: int = 0, limit: int = 100) -> list[User]:
        return await user_repo.get_multi(db, skip=skip, limit=limit)
        
    @staticmethod
    async def soft_delete(db: AsyncSession, *, user_id: uuid.UUID, current_user_id: uuid.UUID) -> User | None:
        user = await user_repo.delete(db, id=user_id)
        if user:
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="soft_delete", entity="user", entity_id=str(user_id)
            )
        return user

user_service = UserService()
