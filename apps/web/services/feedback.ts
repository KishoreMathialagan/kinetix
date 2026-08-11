import type { Feedback, FeedbackCreate, Paginated } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPost } from '@/lib/api-client'

export interface FeedbackListParams {
  patient_id?: string
  therapist_id?: string
  page?: number
  size?: number
}

export function submitFeedback(payload: FeedbackCreate) {
  return apiPost<Feedback>('/feedback', payload)
}

export function listFeedback(params: FeedbackListParams = {}) {
  return apiGet<Paginated<Feedback>>(`/feedback${buildQueryString(params)}`)
}

export function getTherapistFeedback(therapistId: string, params: { page?: number; size?: number } = {}) {
  return apiGet<Paginated<Feedback>>(`/feedback/therapist/${therapistId}${buildQueryString(params)}`)
}
