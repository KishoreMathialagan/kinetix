import type {
  Paginated,
  Therapist,
  TherapistCreate,
  TherapistDashboard,
  TherapistProfile,
  TherapistStatus,
  TherapistUpdate,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPost, apiPut } from '@/lib/api-client'

export interface TherapistListParams {
  search?: string
  name?: string
  specialty?: string
  status?: TherapistStatus
  page?: number
  size?: number
}

export function listTherapists(params: TherapistListParams = {}) {
  return apiGet<Paginated<Therapist>>(`/therapists${buildQueryString(params)}`)
}

export function createTherapist(payload: TherapistCreate) {
  return apiPost<Therapist>('/therapists', payload)
}

export function searchTherapists(params: TherapistListParams = {}) {
  return apiGet<Paginated<Therapist>>(`/therapists/search${buildQueryString(params)}`)
}

export function getTherapist(therapistId: string) {
  return apiGet<Therapist>(`/therapists/${therapistId}`)
}

export function updateTherapist(therapistId: string, payload: TherapistUpdate) {
  return apiPut<Therapist>(`/therapists/${therapistId}`, payload)
}

export function getTherapistDashboardById(therapistId: string) {
  return apiGet<TherapistDashboard>(`/therapists/${therapistId}/dashboard`)
}

export function getMyTherapistProfile() {
  return apiGet<TherapistProfile>('/therapists/me/profile')
}

export function createMyTherapistProfile(payload: TherapistUpdate) {
  return apiPost<Therapist>('/therapists/me/profile', payload)
}

export function updateMyTherapistProfile(payload: TherapistUpdate) {
  return apiPut<Therapist>('/therapists/me/profile', payload)
}
