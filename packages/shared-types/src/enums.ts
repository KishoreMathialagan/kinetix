export const UserRoles = ['admin', 'therapist', 'patient'] as const;
export type UserRole = (typeof UserRoles)[number];

export const AppointmentStatuses = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'missed',
] as const;
export type AppointmentStatus = (typeof AppointmentStatuses)[number];

export const AssessmentTypes = ['initial', 'weekly', 'final'] as const;
export type AssessmentType = (typeof AssessmentTypes)[number];

export const TreatmentStatuses = ['planned', 'in_progress', 'completed', 'cancelled'] as const;
export type TreatmentStatus = (typeof TreatmentStatuses)[number];

export const NotificationTypes = ['email', 'push', 'in_app'] as const;
export type NotificationType = (typeof NotificationTypes)[number];

export const NotificationStatuses = ['unread', 'read', 'archived'] as const;
export type NotificationStatus = (typeof NotificationStatuses)[number];

export const ConsentStatuses = ['pending', 'signed', 'revoked'] as const;
export type ConsentStatus = (typeof ConsentStatuses)[number];

export const SessionStatuses = ['planned', 'completed', 'cancelled', 'no_show'] as const;
export type SessionStatus = (typeof SessionStatuses)[number];

export const Genders = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof Genders)[number];

export const BloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export type BloodGroup = (typeof BloodGroups)[number];

export const DocumentTypes = [
  'mri',
  'x_ray',
  'prescription',
  'lab_report',
  'insurance',
  'referral',
  'other',
] as const;
export type DocumentType = (typeof DocumentTypes)[number];

export const MediaTypes = ['image', 'video', 'audio'] as const;
export type MediaType = (typeof MediaTypes)[number];

export const TherapistStatuses = ['active', 'inactive', 'on_leave'] as const;
export type TherapistStatus = (typeof TherapistStatuses)[number];

export const InvoiceStatuses = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
] as const;
export type InvoiceStatus = (typeof InvoiceStatuses)[number];

export const PaymentStatuses = ['pending', 'completed', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PaymentStatuses)[number];

export const PaymentMethods = ['cash', 'card', 'upi', 'bank_transfer'] as const;
export type PaymentMethod = (typeof PaymentMethods)[number];

export const DevicePlatforms = ['android', 'ios', 'web'] as const;
export type DevicePlatform = (typeof DevicePlatforms)[number];

export const OtpPurposes = ['login', 'registration', 'forgot_password'] as const;
export type OtpPurpose = (typeof OtpPurposes)[number];

export const StrengthScales = ['0', '1', '2', '3', '4', '5'] as const;
export type StrengthScale = (typeof StrengthScales)[number];
