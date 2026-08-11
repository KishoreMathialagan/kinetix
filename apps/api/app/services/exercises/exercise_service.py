import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercises import ExerciseCompletion, ExerciseItem, ExerciseProgram
from app.repositories.exercise_repository import (
    exercise_completion_repo,
    exercise_item_repo,
    exercise_program_repo,
)
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.exercises import (
    CheckInCreate,
    ExerciseItemCreate,
    ExerciseItemUpdate,
    ExerciseProgramCreate,
    ExerciseProgramUpdate,
)
from app.services.auth.auth_service import auth_service


class ExerciseService:
    async def create_program(
        self, db: AsyncSession, *, request: ExerciseProgramCreate, current_user_id: uuid.UUID
    ) -> ExerciseProgram:
        if not await patient_repo.get(db, id=request.patient_id):
            raise ValueError("Patient not found.")
        actor_therapist = await self._user_therapist_id(db, current_user_id)
        therapist_id = request.therapist_id or actor_therapist
        if not therapist_id:
            raise ValueError("A therapist must create exercise programs.")
        if not await therapist_repo.get(db, id=therapist_id):
            raise ValueError("Therapist not found.")

        try:
            program = ExerciseProgram(
                patient_id=request.patient_id,
                therapist_id=therapist_id,
                title=request.title,
                instructions=request.instructions,
                frequency=request.frequency,
                duration=request.duration,
                created_by=current_user_id,
            )
            db.add(program)
            await db.flush()
            for item_in in request.items:
                db.add(ExerciseItem(exercise_program_id=program.id, **item_in.model_dump()))
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="exercise_program_created",
                entity="exercise_program", entity_id=str(program.id),
            )
            await db.commit()
            program = await exercise_program_repo.get(db, id=program.id)
            return program
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to create exercise program: {exc!s}")

    async def update_program(
        self, db: AsyncSession, *, program_id: uuid.UUID,
        request: ExerciseProgramUpdate, current_user_id: uuid.UUID
    ) -> ExerciseProgram:
        program = await exercise_program_repo.get(db, id=program_id)
        if not program:
            raise ValueError("Exercise program not found.")
        try:
            updated = await exercise_program_repo.update(
                db, db_obj=program, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="exercise_program_updated",
                entity="exercise_program", entity_id=str(program_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update exercise program: {exc!s}")

    async def delete_program(
        self, db: AsyncSession, *, program_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> None:
        program = await exercise_program_repo.delete(db, id=program_id)
        if not program:
            raise ValueError("Exercise program not found.")
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="exercise_program_deleted",
            entity="exercise_program", entity_id=str(program_id),
        )

    async def add_item(
        self, db: AsyncSession, *, program_id: uuid.UUID,
        request: ExerciseItemCreate, current_user_id: uuid.UUID
    ) -> ExerciseItem:
        program = await exercise_program_repo.get(db, id=program_id)
        if not program:
            raise ValueError("Exercise program not found.")
        try:
            item = ExerciseItem(exercise_program_id=program_id, **request.model_dump())
            db.add(item)
            await db.flush()
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="exercise_item_created",
                entity="exercise_item", entity_id=str(item.id),
            )
            await db.commit()
            await db.refresh(item)
            return item
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to add exercise item: {exc!s}")

    async def update_item(
        self, db: AsyncSession, *, item_id: uuid.UUID,
        request: ExerciseItemUpdate, current_user_id: uuid.UUID
    ) -> ExerciseItem:
        item = await exercise_item_repo.get(db, id=item_id)
        if not item:
            raise ValueError("Exercise item not found.")
        try:
            updated = await exercise_item_repo.update(
                db, db_obj=item, obj_in=request.model_dump(exclude_unset=True)
            )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="exercise_item_updated",
                entity="exercise_item", entity_id=str(item_id),
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update exercise item: {exc!s}")

    async def delete_item(
        self, db: AsyncSession, *, item_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> None:
        item = await exercise_item_repo.delete(db, id=item_id)
        if not item:
            raise ValueError("Exercise item not found.")
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="exercise_item_deleted",
            entity="exercise_item", entity_id=str(item_id),
        )

    async def check_in(
        self, db: AsyncSession, *, program_id: uuid.UUID,
        request: CheckInCreate, current_user_id: uuid.UUID
    ) -> ExerciseCompletion:
        program = await exercise_program_repo.get(db, id=program_id)
        if not program:
            raise ValueError("Exercise program not found.")
        if request.exercise_item_id:
            item = await exercise_item_repo.get(db, id=request.exercise_item_id)
            if not item or item.exercise_program_id != program_id:
                raise ValueError("Exercise item does not belong to this program.")
        completion = ExerciseCompletion(
            patient_id=program.patient_id,
            exercise_program_id=program_id,
            exercise_item_id=request.exercise_item_id,
            notes=request.notes,
        )
        saved = await exercise_completion_repo.create(db, obj_in=completion)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="exercise_check_in",
            entity="exercise_completion", entity_id=str(saved.id),
        )
        return saved

    async def compliance(
        self, db: AsyncSession, *, program_id: uuid.UUID
    ) -> dict:
        program = await exercise_program_repo.get(db, id=program_id)
        if not program:
            raise ValueError("Exercise program not found.")
        completions = await exercise_completion_repo.list_for_program(
            db, program_id=program_id, patient_id=program.patient_id
        )
        expected = max(len(program.exercise_items), 1)
        completed_items = await exercise_completion_repo.distinct_completed_items(
            db, program_id=program_id, patient_id=program.patient_id
        )
        completed = len([c for c in completed_items if c is not None])
        if completed_items == {None} and completions:
            completed = 1
        score = round((completed / expected) * 100, 2) if expected else 0.0
        return {
            "exercise_program_id": program_id,
            "patient_id": program.patient_id,
            "title": program.title,
            "expected_count": expected,
            "completed_count": completed,
            "score": score,
            "completions": completions,
        }

    async def patient_compliance(self, db: AsyncSession, *, patient_id: uuid.UUID) -> dict:
        programs = await exercise_program_repo.list_for_patient(db, patient_id=patient_id)
        per_program: list[dict] = []
        for program in programs:
            data = await self.compliance(db, program_id=program.id)
            per_program.append(data)
        overall = round(sum(p["score"] for p in per_program) / len(per_program), 2) if per_program else 0.0
        return {
            "patient_id": patient_id,
            "program_count": len(per_program),
            "overall_score": overall,
            "programs": per_program,
        }

    @staticmethod
    async def _user_therapist_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID | None:
        therapist = await therapist_repo.get_by_user_id(db, user_id=user_id)
        return therapist.id if therapist else None


exercise_service = ExerciseService()