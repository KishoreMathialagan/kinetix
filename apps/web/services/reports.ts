import type { Report, ReportGenerateRequest } from '@kinetix/shared-types'
import { apiBlob, apiGet, apiPost } from '@/lib/api-client'

export function generateReport(payload: ReportGenerateRequest) {
  return apiPost<Report>('/reports/generate', payload)
}

export function getPatientReport(patientId: string) {
  return apiGet<Record<string, unknown>>(`/reports/patient/${patientId}`)
}

export function getTherapistReport(therapistId: string) {
  return apiGet<Record<string, unknown>>(`/reports/therapist/${therapistId}`)
}

export function getClinicReport() {
  return apiGet<Record<string, unknown>>('/reports/clinic')
}

export function downloadReport(reportId: string) {
  return apiBlob(`/reports/${reportId}/download`)
}
