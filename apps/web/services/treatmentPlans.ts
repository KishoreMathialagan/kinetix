import type { TreatmentPlan, TreatmentPlanCreate, TreatmentPlanUpdate } from '@kinetix/shared-types'
import { apiGet, apiPost, apiPut } from '@/lib/api-client'

export function listPatientPlans(patientId: string) {
  return apiGet<TreatmentPlan[]>(`/treatment-plans/${patientId}/plans`)
}

export function getPlan(planId: string) {
  return apiGet<TreatmentPlan>(`/treatment-plans/${planId}`)
}

export function createPlan(payload: TreatmentPlanCreate) {
  return apiPost<TreatmentPlan>('/treatment-plans', payload)
}

export function updatePlan(planId: string, payload: TreatmentPlanUpdate) {
  return apiPut<TreatmentPlan>(`/treatment-plans/${planId}`, payload)
}
