import { buildQueryString } from '@kinetix/utils'
import { apiGet } from '@/lib/api-client'

export interface SearchPatientHit {
  id: string
  patient_code: string | null
  name: string | null
  email: string | null
}

export interface SearchTherapistHit {
  id: string
  license_number: string | null
  name: string | null
  email: string | null
  specialization: string | null
}

export interface SearchAppointmentHit {
  id: string
  appointment_type: string
  status: string
}

export interface SearchReportHit {
  id: string
  report_type: string
}

export interface GlobalSearchResults {
  query: string
  patients: SearchPatientHit[]
  therapists: SearchTherapistHit[]
  appointments: SearchAppointmentHit[]
  reports: SearchReportHit[]
}

export function globalSearch(query: string) {
  return apiGet<GlobalSearchResults>(`/search${buildQueryString({ q: query })}`)
}
