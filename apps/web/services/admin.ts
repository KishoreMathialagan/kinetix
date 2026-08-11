import type { AdminDashboardStats, AuditLog, ClinicSettings, Paginated } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiGet, apiPut } from '@/lib/api-client'

export function getStatistics() {
  return apiGet<AdminDashboardStats>('/admin/statistics')
}

export function listAuditLogs(params: { entity_type?: string; entity_id?: string; action?: string; page?: number; size?: number } = {}) {
  return apiGet<Paginated<AuditLog>>(`/admin/audit-logs${buildQueryString(params)}`)
}

export function getSettings() {
  return apiGet<ClinicSettings>('/admin/settings')
}

export function updateSettings(payload: Partial<ClinicSettings>) {
  return apiPut<ClinicSettings>('/admin/settings', payload)
}
