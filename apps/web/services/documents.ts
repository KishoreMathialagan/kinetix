import type { DocumentVersion, PatientDocument } from '@kinetix/shared-types'
import { apiBlob, apiDelete, apiGet, apiUpload } from '@/lib/api-client'

export function uploadDocument(patientId: string, formData: FormData) {
  return apiUpload<PatientDocument>(`/patients/${patientId}/documents`, formData)
}

export function listPatientDocuments(patientId: string) {
  return apiGet<PatientDocument[]>(`/patients/${patientId}/documents`)
}

export function downloadDocument(documentId: string) {
  return apiBlob(`/documents/${documentId}`)
}

export function deleteDocument(documentId: string) {
  return apiDelete<void>(`/documents/${documentId}`)
}

export function addDocumentVersion(documentId: string, formData: FormData) {
  return apiUpload<DocumentVersion>(`/documents/${documentId}/versions`, formData)
}

export function listDocumentVersions(documentId: string) {
  return apiGet<DocumentVersion[]>(`/documents/${documentId}/versions`)
}

export function downloadDocumentVersion(documentId: string, versionId: string) {
  return apiBlob(`/documents/${documentId}/versions/${versionId}`)
}

export function deleteDocumentVersion(documentId: string, versionId: string) {
  return apiDelete<void>(`/documents/${documentId}/versions/${versionId}`)
}

export function bulkUploadDocuments(formData: FormData) {
  return apiUpload<PatientDocument[]>('/documents/bulk', formData)
}
