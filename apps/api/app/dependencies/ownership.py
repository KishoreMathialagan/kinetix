import uuid
from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.core import User
from app.models.enums import UserRole
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo


def require_ownership(
    model: Any, path_param_name: str = "resource_id"
) -> Callable[..., Any]:
    """Restrict a request to admins or users who own the referenced resource.

    The dependency loads the resource identified by the route path parameter
    named ``path_param_name`` and allows the request when the current user is:

    * an admin, or
    * the patient referenced by ``resource.patient_id``, or
    * the therapist referenced by ``resource.therapist_id``, or
    * the owner of the profile resource (e.g. ``Patient``/``Therapist``) itself.

    The route still needs role dependencies where roles should be enforced.
    """
    async def ownership_checker(
        request: Request,
        current_user: Annotated[User, Depends(get_current_user)],
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if current_user.role and current_user.role.name == UserRole.ADMIN.value:
            return current_user

        raw_id = request.path_params.get(path_param_name)
        if raw_id is None:
            raise HTTPException(status_code=400, detail="Missing resource id in path")

        try:
            resource_id = uuid.UUID(str(raw_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid resource id")

        resource = await db.get(model, resource_id)
        if resource is None:
            raise HTTPException(status_code=404, detail="Resource not found")

        owner_ids: list[uuid.UUID] = []
        for field in ("patient_id", "therapist_id", "user_id"):
            value = getattr(resource, field, None)
            if value is not None:
                owner_ids.append(value)
        if not owner_ids and hasattr(resource, "exercise_program_id") and resource.exercise_program_id is not None:
            from app.models.exercises import ExerciseProgram
            program = await db.get(ExerciseProgram, resource.exercise_program_id)
            if program is None:
                raise HTTPException(status_code=404, detail="Resource not found")
            for field in ("patient_id", "therapist_id"):
                value = getattr(program, field, None)
                if value is not None:
                    owner_ids.append(value)
        if not owner_ids:
            raise HTTPException(
                status_code=500,
                detail="Ownership resolution is not defined for this resource",
            )

        if current_user.id in owner_ids:
            return current_user
        patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
        if patient and patient.id in owner_ids:
            return current_user
        therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
        if therapist and therapist.id in owner_ids:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )

    return ownership_checker