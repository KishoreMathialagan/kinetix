import type {
  AppointmentStatus,
  ConsentStatus,
  InvoiceStatus,
  PaymentStatus,
  SessionStatus,
  TherapistStatus,
} from '@kinetix/shared-types';

export function titleCase(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusLabel(value: string | null | undefined): string {
  return titleCase(value);
}

export function statusColor(value: string | null | undefined): string {
  switch (value) {
    case 'scheduled':
    case 'planned':
    case 'pending':
    case 'draft':
      return 'bg-blue-100 text-blue-700';
    case 'confirmed':
    case 'active':
    case 'in_progress':
      return 'bg-purple-100 text-purple-700';
    case 'completed':
    case 'signed':
    case 'paid':
    case 'issued':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
    case 'failed':
    case 'revoked':
      return 'bg-red-100 text-red-700';
    case 'missed':
    case 'overdue':
    case 'on_leave':
      return 'bg-orange-100 text-orange-700';
    case 'partially_paid':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'missed',
];

export const SESSION_STATUSES: SessionStatus[] = ['planned', 'completed', 'cancelled', 'no_show'];

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
];

export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded'];

export const CONSENT_STATUSES: ConsentStatus[] = ['pending', 'signed', 'revoked'];

export const THERAPIST_STATUSES: TherapistStatus[] = ['active', 'inactive', 'on_leave'];
