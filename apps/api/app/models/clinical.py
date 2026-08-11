import uuid
from datetime import date, datetime, time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.mixins import AuditMixin, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import AppointmentStatus, AssessmentType, MediaType, StrengthScale

if TYPE_CHECKING:
    from app.models.profiles import Patient, Therapist

class Appointment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "appointments"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    appointment_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(String(20), default=AppointmentStatus.SCHEDULED, index=True)

    __table_args__ = (
        Index("ix_appointments_patient_date", "patient_id", "scheduled_date"),
        Index("ix_appointments_therapist_date", "therapist_id", "scheduled_date"),
        Index("ix_appointments_status_date", "status", "scheduled_date"),
    )

    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    therapist: Mapped["Therapist"] = relationship("Therapist", back_populates="appointments")
    assessment: Mapped[Optional["Assessment"]] = relationship("Assessment", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    treatment_sessions: Mapped[list["TreatmentSession"]] = relationship("TreatmentSession", back_populates="appointment", cascade="all, delete-orphan")
    history_records: Mapped[list["AppointmentHistory"]] = relationship("AppointmentHistory", back_populates="appointment", cascade="all, delete-orphan")

class AppointmentHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "appointment_history"
    
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="history_records")

class Assessment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "assessments"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    assessment_type: Mapped[AssessmentType] = mapped_column(String(20), nullable=False, index=True)
    pain_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("pain_score BETWEEN 0 AND 10", name="chk_assessments_pain_score"),
    )

    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="assessment")
    treatment_plan: Mapped[Optional["TreatmentPlan"]] = relationship("TreatmentPlan", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    treatment_sessions: Mapped[list["TreatmentSession"]] = relationship("TreatmentSession", back_populates="assessment")

class TreatmentPlan(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "treatment_plans"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    assessment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="treatment_plan")

class TreatmentSession(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "treatment_sessions"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    assessment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    session_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pain_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pain_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    treatment_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    exercises: Mapped[str | None] = mapped_column(Text, nullable=True)
    modalities: Mapped[str | None] = mapped_column(Text, nullable=True)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("pain_before BETWEEN 0 AND 10", name="chk_treatment_sessions_pain_before"),
        CheckConstraint("pain_after BETWEEN 0 AND 10", name="chk_treatment_sessions_pain_after"),
    )

    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="treatment_sessions")
    assessment: Mapped[Optional["Assessment"]] = relationship("Assessment", back_populates="treatment_sessions")
    progress_records: Mapped[list["ProgressRecord"]] = relationship("ProgressRecord", back_populates="treatment_session", cascade="all, delete-orphan")

class ProgressRecord(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "progress_media"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    treatment_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("treatment_sessions.id", ondelete="CASCADE"), nullable=True)
    media_type: Mapped[MediaType] = mapped_column(String(20), nullable=False)
    media_url: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    treatment_session: Mapped[Optional["TreatmentSession"]] = relationship("TreatmentSession", back_populates="progress_records")

class ProgressMeasurement(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "progress_measurements"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    therapist_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="SET NULL"), nullable=True)
    treatment_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("treatment_sessions.id", ondelete="SET NULL"), nullable=True)
    assessment_type: Mapped[AssessmentType | None] = mapped_column(String(20), nullable=True, index=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    pain_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rom_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    strength_scale: Mapped[StrengthScale | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("pain_score BETWEEN 0 AND 10", name="chk_progress_measurements_pain_score"),
        CheckConstraint("rom_degrees BETWEEN 0 AND 360", name="chk_progress_measurements_rom_degrees"),
        Index("ix_progress_measurements_patient_timestamp", "patient_id", "measured_at"),
    )
