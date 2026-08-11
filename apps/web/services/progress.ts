import type {
  ProgressMeasurement,
  ProgressMeasurementCreate,
  ProgressMeasurementUpdate,
  ProgressOverview,
} from '@kinetix/shared-types'
import { apiGet, apiPost, apiPut } from '@/lib/api-client'

export function getPatientProgress(patientId: string) {
  return apiGet<ProgressOverview>(`/patients/${patientId}/progress`)
}

export function listMeasurements(patientId: string) {
  return apiGet<ProgressMeasurement[]>(`/patients/${patientId}/progress/measurements`)
}

export function createMeasurement(payload: ProgressMeasurementCreate) {
  return apiPost<ProgressMeasurement>('/progress/measurements', payload)
}

export function updateMeasurement(measurementId: string, payload: ProgressMeasurementUpdate) {
  return apiPut<ProgressMeasurement>(`/progress/measurements/${measurementId}`, payload)
}
