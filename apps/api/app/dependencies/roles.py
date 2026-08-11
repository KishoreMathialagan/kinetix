from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.core import User


def require_role(allowed_roles: list[str]) -> Callable:
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]):
        if not current_user.role or current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required role to perform this action"
            )
        return current_user
    return role_checker
