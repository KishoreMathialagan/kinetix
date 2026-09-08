from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.communication import DeviceToken, Notification
from app.models.core import User
from app.repositories.communication_repository import device_token_repo, notification_repo
from app.schemas.notifications import (
    DeviceTokenCreateRequest,
    DeviceTokenResponse,
    NotificationCreateRequest,
    NotificationResponse,
)
from app.services.auth.auth_service import auth_service
from app.utils.datetime import utc_now
from app.utils.pagination import PaginatedResponse

router = APIRouter()


@router.get("/notifications", summary="Get notifications", description="List the current user's notifications.")
async def list_notifications(
    unread_only: bool = False,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await notification_repo.list_for_user(
        db, user_id=current_user.id, unread_only=unread_only, page=page, size=size
    )


@router.get("/notifications/unread-count", summary="Get unread notification count")
async def unread_count(
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return {"count": await notification_repo.count_unread(db, user_id=current_user.id)}


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse, summary="Mark a notification as read")
async def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    notification = await notification_repo.get(db, id=notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.read_at = utc_now()
    try:
        await db.commit()
        await db.refresh(notification)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark notification: {exc!s}")
    return notification


@router.patch("/notifications/read-all", summary="Mark all notifications as read")
async def mark_all_read(
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    updated = await notification_repo.mark_all_read(db, user_id=current_user.id)
    return {"updated": updated}


@router.post("/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED, summary="Create a notification", description="Create a notification for a user (admin only).")
async def create_notification(
    request: NotificationCreateRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    notification = Notification(
        user_id=request.user_id,
        title=request.title,
        body=request.body,
        notification_type=request.notification_type,
        created_by=current_user.id,
    )
    saved = await notification_repo.create(db, obj_in=notification)
    await auth_service.log_audit_event(
        db, user_id=current_user.id, action="notification_created",
        entity="notification", entity_id=str(saved.id),
    )
    return saved


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a notification")
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    notification = await notification_repo.get(db, id=notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    await notification_repo.delete(db, id=notification_id)


@router.post("/notifications/device-tokens", response_model=DeviceTokenResponse, status_code=status.HTTP_201_CREATED, summary="Register a device token", description="Register the current user's push device token.")
async def register_device_token(
    request: DeviceTokenCreateRequest,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    existing = await device_token_repo.get_by_token(db, token=request.token)
    if existing and existing.user_id != current_user.id:
        raise HTTPException(status_code=409, detail="Device token is already registered to another user")
    if existing:
        if not existing.is_active:
            existing.is_active = True
            await db.commit()
            await db.refresh(existing)
        return existing
    token = DeviceToken(
        user_id=current_user.id,
        platform=request.platform.value,
        token=request.token,
        is_active=True,
    )
    return await device_token_repo.create(db, obj_in=token)


@router.get("/notifications/device-tokens", response_model=list[DeviceTokenResponse], summary="List device tokens", description="List the current user's registered device tokens.")
async def list_device_tokens(
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await device_token_repo.list_for_user(db, user_id=current_user.id)


@router.delete("/notifications/device-tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a device token")
async def delete_device_token(
    token_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    token = await device_token_repo.get(db, id=token_id)
    is_admin = current_user.role and current_user.role.name == "admin"
    if not token or (token.user_id != current_user.id and not is_admin):
        raise HTTPException(status_code=404, detail="Device token not found")
    await device_token_repo.delete(db, id=token_id)
