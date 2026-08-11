import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.exercises import ExerciseItem, ExerciseProgram
from app.models.profiles import Patient
from app.repositories.exercise_repository import exercise_item_repo, exercise_program_repo
from app.schemas.exercises import (
    CheckInCreate,
    CheckInResponse,
    ComplianceResponse,
    ExerciseItemCreate,
    ExerciseItemResponse,
    ExerciseItemUpdate,
    ExerciseProgramCreate,
    ExerciseProgramResponse,
    ExerciseProgramUpdate,
)
from app.services.exercises.exercise_service import exercise_service
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()


@router.get("/exercise-library", response_model=PaginatedResponse[ExerciseItemResponse], summary="Exercise library", description="Browse the exercise catalog with optional category filter.")
async def exercise_library(
    category: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await exercise_item_repo.library(db, category=category, page=page, size=size)


@router.get("/exercise-programs", response_model=PaginatedResponse[ExerciseProgramResponse], summary="List exercise programs")
async def list_programs(
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    if patient_id:
        programs = await exercise_program_repo.list_for_patient(db, patient_id=patient_id)
        return paginate(programs, len(programs), 1, size)
    return await exercise_program_repo.list_all(db, page=page, size=size)


@router.get("/exercise-programs/{program_id}", response_model=ExerciseProgramResponse, summary="Get an exercise program")
async def get_program(
    program_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    program = await exercise_program_repo.get(db, id=program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Exercise program not found")
    return program


@router.post("/exercise-programs", response_model=ExerciseProgramResponse, status_code=status.HTTP_201_CREATED, summary="Create an exercise program")
async def create_program(
    request: ExerciseProgramCreate,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist"]))],
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.create_program(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/exercise-programs/{program_id}", response_model=ExerciseProgramResponse, summary="Update an exercise program")
async def update_program(
    program_id: uuid.UUID,
    request: ExerciseProgramUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.update_program(
            db, program_id=program_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/exercise-programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an exercise program")
async def delete_program(
    program_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        await exercise_service.delete_program(db, program_id=program_id, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/exercise-programs/{program_id}/items", response_model=ExerciseItemResponse, status_code=status.HTTP_201_CREATED, summary="Add an item to an exercise program")
async def add_item(
    program_id: uuid.UUID,
    request: ExerciseItemCreate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.add_item(
            db, program_id=program_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/exercise-programs/{program_id}/items/{item_id}", response_model=ExerciseItemResponse, summary="Update an exercise item")
async def update_item(
    program_id: uuid.UUID,
    item_id: uuid.UUID,
    request: ExerciseItemUpdate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ExerciseItem, "item_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.update_item(
            db, item_id=item_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/exercise-programs/{program_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an exercise item")
async def delete_item(
    program_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(ExerciseItem, "item_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        await exercise_service.delete_item(db, item_id=item_id, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/exercise-programs/{program_id}/check-in", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED, summary="Exercise check-in", description="Record an exercise completion check-in for the program's patient.")
async def check_in(
    program_id: uuid.UUID,
    request: CheckInCreate,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.check_in(
            db, program_id=program_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/exercise-programs/{program_id}/compliance", response_model=ComplianceResponse, summary="Exercise program compliance", description="Compliance score for an exercise program (completed items / expected items).")
async def program_compliance(
    program_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(ExerciseProgram, "program_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await exercise_service.compliance(db, program_id=program_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/patients/{patient_id}/compliance", summary="Patient exercise compliance", description="Compliance breakdown across all exercise programs for a patient.")
async def patient_compliance(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db),
):
    return await exercise_service.patient_compliance(db, patient_id=patient_id)