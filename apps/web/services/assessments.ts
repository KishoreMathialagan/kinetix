import type { Assessment, AssessmentCreate, AssessmentUpdate, Paginated } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPost, apiPut } from '@/lib/api-client'

export interface AssessmentListParams {
  patient_id?: string
  page?: number
  size?: number
}

export function listAssessments(params: AssessmentListParams = {}) {
  return apiGet<Paginated<Assessment>>(`/assessments${buildQueryString(params)}`)
}

export function getAssessment(assessmentId: string) {
  return apiGet<Assessment>(`/assessments/${assessmentId}`)
}

export function createAssessment(payload: AssessmentCreate) {
  return apiPost<Assessment>('/assessments', payload)
}

export function createInitialAssessment(payload: AssessmentCreate) {
  return apiPost<Assessment>('/assessments/initial', payload)
}

export function createWeeklyAssessment(payload: AssessmentCreate) {
  return apiPost<Assessment>('/assessments/weekly', payload)
}

export function createFinalAssessment(payload: AssessmentCreate) {
  return apiPost<Assessment>('/assessments/final', payload)
}

export function updateAssessment(assessmentId: string, payload: AssessmentUpdate) {
  return apiPut<Assessment>(`/assessments/${assessmentId}`, payload)
}
