import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.models.core import AuditLog, User
from app.repositories.user_repository import user_repo


class AuthService:
    @staticmethod
    async def log_audit_event(
        db: AsyncSession, 
        user_id: uuid.UUID | None, 
        action: str, 
        entity: str, 
        entity_id: str,
        old_value: str | None = None,
        new_value: str | None = None
    ) -> None:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value
        )
        db.add(audit)
        await db.commit()

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
        user = await user_repo.get_by_email(db, email=email)
        if not user:
            return None
        
        if not pwd_context.verify(password, user.password_hash):
            # In a real app, track failed attempts for lockout here
            return None
            
        if not user.is_active:
            return None

        # Log successful login
        await AuthService.log_audit_event(
            db, user_id=user.id, action="login", entity="user", entity_id=str(user.id)
        )
        return user

auth_service = AuthService()
