import type { User, UserCreate, UserUpdate } from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client'

export interface UserListParams {
  skip?: number
  limit?: number
}

export function listUsers(params: UserListParams = {}) {
  return apiGet<User[]>(`/users${buildQueryString(params)}`)
}

export function createUser(payload: UserCreate) {
  return apiPost<User>('/users', payload)
}

export function getUser(userId: string) {
  return apiGet<User>(`/users/${userId}`)
}

export function updateUser(userId: string, payload: UserUpdate) {
  return apiPut<User>(`/users/${userId}`, payload)
}

export function resetUserPassword(userId: string, newPassword: string) {
  return apiPut<User>(`/users/${userId}/password`, { new_password: newPassword })
}

export function deleteUser(userId: string) {
  return apiDelete<void>(`/users/${userId}`)
}
