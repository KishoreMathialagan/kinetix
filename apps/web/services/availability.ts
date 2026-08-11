import type {
  AvailabilityCreate,
  LeaveRequest,
  TherapistAvailability,
  TherapistCapacity,
  TherapistLeave,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPost, apiPut } from '@/lib/api-client'

export function addAvailability(therapistId: string, payload: AvailabilityCreate) {
  return apiPost<TherapistAvailability>(`/therapists/${therapistId}/availability`, payload)
}

export function listAvailability(therapistId: string) {
  return apiGet<TherapistAvailability[]>(`/therapists/${therapistId}/availability`)
}

export function updateAvailability(therapistId: string, availabilityId: string, payload: AvailabilityCreate) {
  return apiPut<TherapistAvailability>(
    `/therapists/${therapistId}/availability${buildQueryString({ availability_id: availabilityId })}`,
    payload
  )
}

export function requestLeave(therapistId: string, payload: LeaveRequest) {
  return apiPost<TherapistLeave>(`/therapists/${therapistId}/leave`, payload)
}

export function getTherapistCapacity(therapistId: string) {
  return apiGet<TherapistCapacity>(`/therapists/${therapistId}/capacity`)
}
