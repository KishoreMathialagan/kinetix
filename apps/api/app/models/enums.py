import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    THERAPIST = "therapist"
    PATIENT = "patient"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"

class AssessmentType(str, enum.Enum):
    INITIAL = "initial"
    WEEKLY = "weekly"
    FINAL = "final"

class TreatmentStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class NotificationType(str, enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class ConsentStatus(str, enum.Enum):
    PENDING = "pending"
    SIGNED = "signed"
    REVOKED = "revoked"

class SessionStatus(str, enum.Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"
    UNKNOWN = "unknown"

class DocumentType(str, enum.Enum):
    MRI = "mri"
    X_RAY = "x_ray"
    PRESCRIPTION = "prescription"
    LAB_REPORT = "lab_report"
    INSURANCE = "insurance"
    REFERRAL = "referral"
    OTHER = "other"

class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"

class TherapistStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"

class DevicePlatform(str, enum.Enum):
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"

class OtpPurpose(str, enum.Enum):
    LOGIN = "login"
    REGISTRATION = "registration"
    FORGOT_PASSWORD = "forgot_password"

class StrengthScale(str, enum.Enum):
    ZERO = "0"
    TRACE = "1"
    POOR = "2"
    FAIR = "3"
    GOOD = "4"
    NORMAL = "5"
