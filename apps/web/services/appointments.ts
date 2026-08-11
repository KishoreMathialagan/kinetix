import type {
  Appointment,
  AppointmentCreate,
  AppointmentStatus,
  AppointmentUpdate,
  AssignmentRecommendation,
  AssignTherapistRequest,
  CalendarResponse,
  CancelRequest,
  Paginated,
  RescheduleRequest,
  TherapistAssignment,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client'

export type AppointmentListParams = {
  patient_id?: string
  therapist_id?: string
  appt_status?: AppointmentStatus
  start_date?: string
  end_date?: string
  page?: number
  size?: number
}

export function createAppointment(payload: AppointmentCreate) {
  return apiPost<Appointment>('/appointments', payload)
}

export function listAppointments(params: AppointmentListParams = {}) {
  return apiGet<Paginated<Appointment>>(`/appointments${buildQueryString(params)}`)
}

export function getAppointment(appointmentId: string) {
  return apiGet<Appointment>(`/appointments/${appointmentId}`)
}

export function updateAppointment(appointmentId: string, payload: AppointmentUpdate) {
  return apiPatch<Appointment>(`/appointments/${appointmentId}`, payload)
}

export function rescheduleAppointment(appointmentId: string, payload: RescheduleRequest) {
  return apiPost<Appointment>(`/appointments/${appointmentId}/reschedule`, payload)
}

export function cancelAppointment(appointmentId: string, payload: CancelRequest) {
  return apiPost<Appointment>(`/appointments/${appointmentId}/cancel`, payload)
}

export function completeAppointment(appointmentId: string) {
  return apiPatch<Appointment>(`/appointments/${appointmentId}/complete`)
}

export function deleteAppointment(appointmentId: string) {
  return apiDelete<void>(`/appointments/${appointmentId}`)
}

export function manualAssign(patientId: string, payload: AssignTherapistRequest) {
  return apiPost<TherapistAssignment>(
    `/assignments/manual${buildQueryString({ patient_id: patientId })}`,
    payload
  )
}

export function getRecommendations(params: { patient_id?: string; required_specialization?: string }) {
  return apiGet<AssignmentRecommendation[]>(`/assignments/recommendations${buildQueryString(params)}`)
}

export function getCalendar(params: {
  patient_id?: string
  therapist_id?: string
  start_date?: string
  end_date?: string
}) {
  return apiGet<CalendarResponse>(`/calendar${buildQueryString(params)}`)
}
