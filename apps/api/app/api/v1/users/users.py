import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.repositories.user_repository import user_repo
from app.schemas.users.user import AdminPasswordResetRequest, UserCreate, UserResponse, UserUpdate
from app.services.auth.auth_service import auth_service
from app.services.users.user_service import user_service

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        return await user_service.create_user(db, user_in=user_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[UserResponse])
async def list_users(
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.list_users(db, skip=skip, limit=limit)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    try:
        user = await user_service.update_user(db, user_id=user_id, user_in=user_in, current_user_id=current_user.id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.soft_delete(db, user_id=user_id, current_user_id=current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

@router.put("/{user_id}/password", summary="Reset a user's password", description="Admin can reset the password of a patient or therapist account. Admin accounts cannot be reset.")
async def reset_user_password(
    user_id: uuid.UUID,
    user_in: AdminPasswordResetRequest,
    current_user: Annotated[User, Depends(require_role(["admin"]))],
    db: AsyncSession = Depends(get_db)
):
    user = await user_repo.get_with_role(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role and user.role.name == "admin":
        raise HTTPException(status_code=403, detail="Cannot reset an admin account's password")

    await user_service.reset_password(db, user=user, new_password=user_in.new_password)

    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="password_reset_admin", entity="user", entity_id=str(user_id)
    )
    return {"message": "Password reset successfully"}
