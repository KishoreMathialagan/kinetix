import type { DeviceToken, Notification, NotificationCreateRequest, Paginated } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client'

export interface NotificationListParams {
  type?: string
  page?: number
  size?: number
}

export function listNotifications(params: NotificationListParams = {}) {
  return apiGet<Paginated<Notification>>(`/notifications${buildQueryString(params)}`)
}

export function getUnreadCount() {
  return apiGet<{ unread_count: number }>('/notifications/unread-count')
}

export function markRead(notificationId: string) {
  return apiPatch<Notification>(`/notifications/${notificationId}/read`)
}

export function markAllRead() {
  return apiPatch<void>('/notifications/read-all')
}

export function createNotification(payload: NotificationCreateRequest) {
  return apiPost<Notification>('/notifications', payload)
}

export function deleteNotification(notificationId: string) {
  return apiDelete<void>(`/notifications/${notificationId}`)
}

export function registerDeviceToken(payload: { token: string; platform: string }) {
  return apiPost<DeviceToken>('/notifications/device-tokens', payload)
}

export function listDeviceTokens() {
  return apiGet<DeviceToken[]>('/notifications/device-tokens')
}

export function deleteDeviceToken(tokenId: string) {
  return apiDelete<void>(`/notifications/device-tokens/${tokenId}`)
}
