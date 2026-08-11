import { beforeEach, describe, expect, it } from 'vitest'

import { homePathForRole, useAuthStore, userRole } from '@/stores/auth-store'
import type { UserMe } from '@kinetix/shared-types'

const user: UserMe = {
  id: 'u1',
  role: 'patient',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  phone: '123',
  is_verified: true,
  is_active: true,
  patient_id: null,
  therapist_id: null,
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  useAuthStore.getState().clear()
})

describe('auth store', () => {
  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('setTokens marks the session as authenticated', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access-token')
    expect(state.refreshToken).toBe('refresh-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('setUser stores the user profile', () => {
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
    expect(userRole()).toBe('patient')
  })

  it('clear resets everything', () => {
    useAuthStore.getState().setTokens('a', 'r')
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setPermissions(['patients:read'])
    useAuthStore.getState().clear()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.user).toBeNull()
    expect(state.permissions).toEqual([])
    expect(userRole()).toBeNull()
  })
})

describe('homePathForRole', () => {
  it('routes each role to its dashboard', () => {
    expect(homePathForRole('admin')).toBe('/admin/dashboard')
    expect(homePathForRole('therapist')).toBe('/therapist/dashboard')
    expect(homePathForRole('patient')).toBe('/patient/dashboard')
  })

  it('falls back to login', () => {
    expect(homePathForRole(null)).toBe('/login')
    expect(homePathForRole(undefined)).toBe('/login')
  })
})
