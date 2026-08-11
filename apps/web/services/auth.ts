import type {
  LoginRequest,
  OtpSendRequest,
  OtpVerificationRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterRequest,
  TokenResponse,
  UserMe,
} from '@kinetix/shared-types'
import { apiGet, apiPost } from '@/lib/api-client'

export function login(payload: LoginRequest) {
  return apiPost<TokenResponse>('/auth/login', payload)
}

export function refresh(refreshToken: string) {
  return apiPost<TokenResponse>('/auth/refresh', { refresh_token: refreshToken })
}

export async function logout(refreshToken: string) {
  await apiPost<void>('/auth/logout', { refresh_token: refreshToken })
}

export function getMe() {
  return apiGet<UserMe>('/auth/me')
}

export function register(payload: RegisterRequest) {
  return apiPost<void>('/auth/register', payload)
}

export function sendOtp(payload: OtpSendRequest) {
  return apiPost<void>('/auth/otp/send', payload)
}

export function verifyOtp(payload: OtpVerificationRequest) {
  return apiPost<void>('/auth/otp/verify', payload)
}

export function forgotPassword(payload: PasswordResetRequest) {
  return apiPost<void>('/auth/forgot', payload)
}

export function resetPassword(payload: PasswordResetConfirmRequest) {
  return apiPost<void>('/auth/reset', payload)
}
