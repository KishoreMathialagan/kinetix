import type {
  Paginated,
  Patient,
  PatientProfile,
  PatientRegistrationRequest,
  PatientSearchRequest,
  PatientUpdateRequest,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client'

export type PatientListParams = Partial<PatientSearchRequest> & {
  page?: number
  size?: number
}

export function listPatients(params: PatientListParams = {}) {
  return apiGet<Paginated<Patient>>(`/patients${buildQueryString(params)}`)
}

export function getPatient(patientId: string) {
  return apiGet<Patient>(`/patients/${patientId}`)
}

export function registerPatient(payload: PatientRegistrationRequest) {
  return apiPost<Patient>('/patients', payload)
}

export function updatePatient(patientId: string, payload: PatientUpdateRequest) {
  return apiPut<Patient>(`/patients/${patientId}`, payload)
}

export function archivePatient(patientId: string) {
  return apiPatch<Patient>(`/patients/${patientId}/archive`)
}

export function restorePatient(patientId: string) {
  return apiPatch<Patient>(`/patients/${patientId}/restore`)
}

export function searchPatients(payload: PatientSearchRequest & { page?: number; size?: number }) {
  return apiPost<Paginated<Patient>>('/patients/search', payload)
}

export function getMyPatientProfile() {
  return apiGet<PatientProfile>('/patients/me/profile')
}

export function createMyPatientProfile(payload: PatientUpdateRequest) {
  return apiPost<Patient>('/patients/me/profile', payload)
}

export function updateMyPatientProfile(payload: PatientUpdateRequest) {
  return apiPut<Patient>('/patients/me/profile', payload)
}
