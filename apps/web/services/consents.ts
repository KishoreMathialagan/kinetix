import type { ConsentForm, ConsentSignRequest, Paginated } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiBlob, apiGet, apiPost, apiUpload } from '@/lib/api-client'

export interface ConsentListParams {
  patient_id?: string
  status?: string
  page?: number
  size?: number
}

export function uploadConsentTemplate(patientId: string, formData: FormData) {
  return apiUpload<ConsentForm>('/consents/templates', formData)
}

export function listConsents(params: ConsentListParams = {}) {
  return apiGet<Paginated<ConsentForm>>(`/consents${buildQueryString(params)}`)
}

export function signConsent(formId: string, payload: ConsentSignRequest) {
  return apiPost<ConsentForm>(`/consents/${formId}/sign`, payload)
}

export function downloadConsentPdf(formId: string) {
  return apiBlob(`/consents/${formId}/pdf`)
}

export interface ConsentSignature {
  id: string
  consent_form_id: string
  signer_name: string
  signer_role: string
  signature_url: string
  signed_at: string | null
}

export function signPatientConsent(patientId: string, payload: ConsentSignRequest) {
  return apiPost<ConsentSignature>(`/patients/${patientId}/consents`, payload)
}

export function listPatientConsents(patientId: string) {
  return apiGet<ConsentForm[]>(`/patients/${patientId}/consents`)
}
