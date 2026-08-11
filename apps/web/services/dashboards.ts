import type {
  AdminAnalytics,
  AdminDashboardStats,
  PatientDashboardStats,
  TherapistDashboardStats,
} from '@kinetix/shared-types'
import { apiGet } from '@/lib/api-client'

export function getAdminDashboard() {
  return apiGet<AdminDashboardStats>('/dashboard/admin')
}

export function getAdminAnalytics() {
  return apiGet<AdminAnalytics>('/dashboard/admin/analytics')
}

export function getTherapistDashboard() {
  return apiGet<TherapistDashboardStats>('/dashboard/therapist')
}

export function getPatientDashboard() {
  return apiGet<PatientDashboardStats>('/dashboard/patient')
}
