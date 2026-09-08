import uuid
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, String, Text, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.mixins import AuditMixin, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import BloodGroup, Gender, TherapistStatus

if TYPE_CHECKING:
    from app.models.clinical import Appointment
    from app.models.core import User
    from app.models.documents import PatientDocument
    from app.models.exercises import ExerciseProgram

class Patient(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "patients"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[BloodGroup | None] = mapped_column(String(10), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    height: Mapped[str | None] = mapped_column(String(20), nullable=True)
    weight: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_pressure: Mapped[str | None] = mapped_column(String(20), nullable=True)
    temperature_spo2: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_relationship: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emergency_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_concern: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_policy_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="patient")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    documents: Mapped[list["PatientDocument"]] = relationship("PatientDocument", back_populates="patient", cascade="all, delete-orphan")
    exercise_programs: Mapped[list["ExerciseProgram"]] = relationship("ExerciseProgram", back_populates="patient", cascade="all, delete-orphan")
    assigned_therapists: Mapped[list["Therapist"]] = relationship(
        "Therapist", secondary="therapist_assignments", back_populates="assigned_patients"
    )

class Therapist(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "therapists"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    languages: Mapped[str | None] = mapped_column(String(255), nullable=True)
    years_experience: Mapped[int | None] = mapped_column(nullable=True)
    
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[TherapistStatus] = mapped_column(String(20), default=TherapistStatus.ACTIVE)
    profile_photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    capacity: Mapped[int] = mapped_column(default=10, server_default="10")

    user: Mapped["User"] = relationship("User", back_populates="therapist")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="therapist", cascade="all, delete-orphan")
    availabilities: Mapped[list["TherapistAvailability"]] = relationship("TherapistAvailability", back_populates="therapist", cascade="all, delete-orphan")
    leaves: Mapped[list["TherapistLeave"]] = relationship("TherapistLeave", back_populates="therapist", cascade="all, delete-orphan")
    assigned_patients: Mapped[list["Patient"]] = relationship(
        "Patient", secondary="therapist_assignments", back_populates="assigned_therapists"
    )

class TherapistAvailability(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "therapist_availability"

    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    # If specific_date is set, it's an override. Otherwise, it's recurring weekday.
    weekday: Mapped[int | None] = mapped_column(nullable=True) # 0=Monday, 6=Sunday
    specific_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    therapist: Mapped["Therapist"] = relationship("Therapist", back_populates="availabilities")

class TherapistLeave(Base, UUIDMixin, TimestampMixin, AuditMixin):
    __tablename__ = "therapist_leaves"
    
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, approved, rejected, cancelled
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    therapist: Mapped["Therapist"] = relationship("Therapist", back_populates="leaves")

class TherapistAssignment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    __tablename__ = "therapist_assignments"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    therapist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")

    __table_args__ = (
        UniqueConstraint("patient_id", "therapist_id", name="uix_patient_therapist_assignment"),
    )
