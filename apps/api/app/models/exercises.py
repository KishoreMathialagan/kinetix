import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.mixins import AuditMixin, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.utils.datetime import utc_now

if TYPE_CHECKING:
    from app.models.profiles import Patient

class ExerciseProgram(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "exercise_programs"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="exercise_programs")
    # therapist: Mapped["Therapist"] = relationship("Therapist")
    exercise_items: Mapped[list["ExerciseItem"]] = relationship("ExerciseItem", back_populates="program", cascade="all, delete-orphan")

class ExerciseItem(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "exercise_items"

    exercise_program_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exercise_programs.id", ondelete="CASCADE"), nullable=False)
    exercise_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    repetitions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    program: Mapped["ExerciseProgram"] = relationship("ExerciseProgram", back_populates="exercise_items")


class ExerciseCompletion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exercise_completion"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_program_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exercise_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("exercise_items.id", ondelete="CASCADE"), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
