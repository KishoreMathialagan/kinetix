import type { Paginated, TreatmentSession, TreatmentSessionCreate, TreatmentSessionUpdate } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client'

export interface SessionListParams {
  patient_id?: string
  status?: string
  page?: number
  size?: number
}

export function listSessions(params: SessionListParams = {}) {
  return apiGet<Paginated<TreatmentSession>>(`/treatment-sessions${buildQueryString(params)}`)
}

export function getSession(sessionId: string) {
  return apiGet<TreatmentSession>(`/treatment-sessions/${sessionId}`)
}

export function startSession(payload: TreatmentSessionCreate) {
  return apiPost<TreatmentSession>('/treatment-sessions/start', payload)
}

export function endSession(sessionId: string, payload: TreatmentSessionUpdate = {}) {
  return apiPatch<TreatmentSession>(`/treatment-sessions/${sessionId}/end`, payload)
}

export function updateSession(sessionId: string, payload: TreatmentSessionUpdate) {
  return apiPut<TreatmentSession>(`/treatment-sessions/${sessionId}`, payload)
}
