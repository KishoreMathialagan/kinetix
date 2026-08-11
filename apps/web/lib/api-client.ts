import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import type { ApiResponse, TokenResponse } from '@kinetix/shared-types';
import { env } from '@/env';
import { clearSessionCookie } from '@/lib/session';
import { useAuthStore } from '@/stores/auth-store';

export class ApiClientError extends Error {
  code: string;
  status: number;
  errors: unknown[];

  constructor(message: string, code = 'API_ERROR', status = 0, errors: unknown[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

export function toApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; code?: string; errors?: unknown[] } | undefined;
    return new ApiClientError(
      data?.message ?? error.message ?? 'Request failed',
      data?.code ?? 'API_ERROR',
      error.response?.status ?? 0,
      data?.errors ?? [],
    );
  }
  return new ApiClientError(error instanceof Error ? error.message : 'Unknown error');
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    throw new ApiClientError('No refresh token available', 'AUTH_TOKEN_EXPIRED', 401);
  }
  const res = await axios.post<TokenResponse>(
    `${env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { timeout: 30000 },
  );
  setTokens(res.data.access_token, res.data.refresh_token);
  return res.data.access_token;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clear();
        clearSessionCookie();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload &&
    typeof (payload as Record<string, unknown>).success === 'boolean'
  ) {
    return (payload as ApiResponse<T>).data as T;
  }
  return payload as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.get(url, config);
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res = await apiClient.post(url, data, config);
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.put(url, data, config);
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPatch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.patch(url, data, config);
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.delete(url, config);
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res = await apiClient.post(url, formData, {
      ...config,
      headers: { 'Content-Type': 'multipart/form-data', ...config?.headers },
    });
    return unwrap<T>(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function apiUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_URL}${path}`;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiClientError(payload?.message ?? `Download failed (${res.status})`, 'API_ERROR', res.status);
  }
  return res.blob();
}
