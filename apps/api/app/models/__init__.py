# Import all models to ensure they are registered with SQLAlchemy's Base.metadata

from app.database.base import Base

# Billing Models
from app.models.billing import (
    Invoice,
    InvoiceItem,
    Payment,
    TreatmentPackage,
)

# Clinical Models
from app.models.clinical import (
    Appointment,
    Assessment,
    ProgressMeasurement,
    ProgressRecord,
    TreatmentPlan,
    TreatmentSession,
)

# Communication Models
from app.models.communication import (
    DeviceToken,
    Feedback,
    Notification,
)

# Core Models
from app.models.core import (
    AuditLog,
    OtpRequest,
    Permission,
    RefreshToken,
    Role,
    RolePermission,
    User,
)

# Documents Models
from app.models.documents import (
    ConsentForm,
    ConsentSignature,
    DocumentVersion,
    PatientDocument,
    Report,
)

# Enums
from app.models.enums import (
    AppointmentStatus,
    AssessmentType,
    BloodGroup,
    ConsentStatus,
    DevicePlatform,
    DocumentType,
    Gender,
    InvoiceStatus,
    MediaType,
    NotificationStatus,
    NotificationType,
    OtpPurpose,
    PaymentMethod,
    PaymentStatus,
    SessionStatus,
    StrengthScale,
    TherapistStatus,
    TreatmentStatus,
    UserRole,
)

# Exercise Models
from app.models.exercises import (
    ExerciseCompletion,
    ExerciseItem,
    ExerciseProgram,
)

# Profile Models
from app.models.profiles import (
    Patient,
    Therapist,
    TherapistAssignment,
    TherapistAvailability,
)

__all__ = [
    "Appointment",
    "AppointmentStatus",
    "Assessment",
    "AssessmentType",
    "AuditLog",
    "Base",
    "BloodGroup",
    "ConsentForm",
    "ConsentSignature",
    "ConsentStatus",
    "DevicePlatform",
    "DeviceToken",
    "DocumentType",
    "DocumentVersion",
    "ExerciseCompletion",
    "ExerciseItem",
    "ExerciseProgram",
    "Feedback",
    "Gender",
    "Invoice",
    "InvoiceItem",
    "InvoiceStatus",
    "MediaType",
    "Notification",
    "NotificationStatus",
    "NotificationType",
    "OtpPurpose",
    "OtpRequest",
    "Patient",
    "PatientDocument",
    "Payment",
    "PaymentMethod",
    "PaymentStatus",
    "Permission",
    "ProgressMeasurement",
    "ProgressRecord",
    "RefreshToken",
    "Report",
    "Role",
    "RolePermission",
    "SessionStatus",
    "StrengthScale",
    "Therapist",
    "TherapistAssignment",
    "TherapistAvailability",
    "TherapistStatus",
    "TreatmentPackage",
    "TreatmentPlan",
    "TreatmentSession",
    "TreatmentStatus",
    "User",
    "UserRole",
]
