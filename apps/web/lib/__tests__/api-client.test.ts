import { describe, expect, it, afterEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

import { ApiClientError, apiClient, apiGet, toApiError } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

function mockAdapter(payload: unknown, status = 200) {
  apiClient.defaults.adapter = async (config) => {
    if (status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, {
        status,
        statusText: status === 404 ? 'Not Found' : 'Error',
        data: payload,
        headers: new AxiosHeaders(),
        config,
      })
    }
    return {
      data: payload,
      status,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
}

afterEach(() => {
  apiClient.defaults.adapter = undefined
  useAuthStore.getState().clear()
})

describe('toApiError', () => {
  it('passes through ApiClientError instances', () => {
    const err = new ApiClientError('boom', 'X', 418)
    expect(toApiError(err)).toBe(err)
  })

  it('maps axios errors to ApiClientError with server message and status', () => {
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      data: { message: 'Invalid email', code: 'VALIDATION' },
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    })
    const mapped = toApiError(axiosError)
    expect(mapped).toBeInstanceOf(ApiClientError)
    expect(mapped.message).toBe('Invalid email')
    expect(mapped.code).toBe('VALIDATION')
    expect(mapped.status).toBe(400)
  })

  it('falls back for unknown errors', () => {
    const mapped = toApiError(new Error('kaboom'))
    expect(mapped).toBeInstanceOf(ApiClientError)
    expect(mapped.message).toBe('kaboom')
  })
})

describe('apiGet', () => {
  it('unwraps envelope responses', async () => {
    mockAdapter({ success: true, data: { id: 'p1', status: 'active' } })
    const result = await apiGet<{ id: string; status: string }>('/patients/p1')
    expect(result).toEqual({ id: 'p1', status: 'active' })
  })

  it('returns raw payloads when no envelope is present', async () => {
    mockAdapter({ items: [], total: 0 })
    const result = await apiGet<{ items: unknown[]; total: number }>('/patients')
    expect(result).toEqual({ items: [], total: 0 })
  })

  it('attaches the bearer token from the auth store', async () => {
    let seenAuth: string | undefined
    apiClient.defaults.adapter = async (config) => {
      seenAuth = config.headers?.Authorization as string | undefined
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    }
    useAuthStore.getState().setTokens('abc123', 'refresh456')
    await apiGet('/patients')
    expect(seenAuth).toBe('Bearer abc123')
  })

  it('throws ApiClientError on failure', async () => {
    mockAdapter({ message: 'Not found' }, 404)
    await expect(apiGet('/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    })
  })
})
