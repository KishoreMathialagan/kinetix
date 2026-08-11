import json
import logging
import uuid
from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.core import Role, User
from app.models.enums import UserRole
from app.services.redis import RedisManager

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 3600


async def _get_redis_or_none() -> Redis | None:
    try:
        return await RedisManager.get_client()
    except Exception as exc:
        logger.debug("Redis unavailable, falling back to database: %s", exc)
        return None


async def _cached_or_db_permissions(
    role_id: uuid.UUID,
    db: AsyncSession,
    redis: Redis | None,
) -> list[dict[str, str]]:
    cache_key = f"role_permissions:{role_id}"

    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return cast(list[dict[str, str]], json.loads(cached))
        except Exception as exc:
            logger.debug("Failed to read role permissions from Redis: %s", exc)
            redis = None

    stmt = (
        select(Role)
        .where(Role.id == role_id)
        .options(selectinload(Role.permissions))
    )
    result = await db.execute(stmt)
    role = result.scalar_one_or_none()

    if role is None:
        raise HTTPException(status_code=403, detail="Role not found")

    permissions = [{"module": p.module, "action": p.action} for p in role.permissions]

    if redis is not None:
        try:
            await redis.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(permissions))
        except Exception as exc:
            logger.debug("Failed to cache role permissions: %s", exc)

    return permissions


def require_permission(required_module: str, required_action: str) -> Callable[..., Any]:
    async def permission_checker(
        current_user: Annotated[User, Depends(get_current_user)],
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if not current_user.role_id:
            raise HTTPException(status_code=403, detail="User has no assigned role")

        always_allow = current_user.role and current_user.role.name == UserRole.ADMIN.value

        redis = await _get_redis_or_none()
        permissions = await _cached_or_db_permissions(current_user.role_id, db, redis)

        has_perm = always_allow or any(
            p["module"] == required_module and p["action"] == required_action
            for p in permissions
        )

        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You do not have the required permission: {required_module}.{required_action}",
            )
        return current_user

    return permission_checker