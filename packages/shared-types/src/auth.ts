import type { Gender, OtpPurpose, UserRole } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
  dob?: string | null;
  gender?: Gender | null;
  blood_group?: string | null;
  address?: string | null;
}

export interface OtpSendRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface OtpVerificationRequest {
  email: string;
  otp: string;
  purpose?: OtpPurpose;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  otp: string;
  new_password: string;
}

export interface UserMe {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole | null;
  is_verified: boolean;
  is_active: boolean;
  patient_id: string | null;
  therapist_id: string | null;
  created_at: string;
}

export interface User {
  id: string;
  role_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
  role_id: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
}
