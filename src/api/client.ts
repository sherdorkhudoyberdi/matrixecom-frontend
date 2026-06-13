import type { ApiErrorData, ApiResponse } from '@/types/api'
import { UCODE_APP_ID, UCODE_ENVIRONMENT_ID, UCODE_INVOKE_URL } from '@/config/ucode'

const API_URL = import.meta.env.VITE_API_URL ?? UCODE_INVOKE_URL
const ENVIRONMENT_ID = import.meta.env.VITE_ENVIRONMENT_ID ?? UCODE_ENVIRONMENT_ID
const APP_ID = import.meta.env.VITE_APP_ID ?? UCODE_APP_ID

const ACCESS_TOKEN_KEY = 'matrixecom_access_token'
const REFRESH_TOKEN_KEY = 'matrixecom_refresh_token'

export class ApiClientError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function buildHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'environment-id': ENVIRONMENT_ID,
    'x-api-key': APP_ID,
    Authorization: 'API-KEY',
  }
  if (accessToken) {
    headers['X-Access-Token'] = accessToken
  }
  return headers
}

type RawJson = Record<string, unknown>

function extractErrorMessage(json: RawJson): string {
  const errData =
    typeof json.data === 'object' && json.data !== null
      ? (json.data as ApiErrorData)
      : undefined
  return (
    errData?.message ??
    errData?.error ??
    (typeof json.data === 'string' ? json.data : undefined) ??
    (typeof json.custom_message === 'string' ? json.custom_message : undefined) ??
    (typeof json.description === 'string' && json.description !== '...'
      ? json.description
      : undefined) ??
    'Request failed'
  )
}

/** Unwrap local `{status:success,data}` or Ucode prod `{status:CREATED,data:{status:success,data}}`. */
function unwrapApiPayload(json: RawJson): { ok: true; data: unknown } | { ok: false; message: string; code?: string } {
  const inner = json.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const envelope = inner as RawJson
    const innerStatus = String(envelope.status ?? '')
    if (innerStatus === 'success') {
      return { ok: true, data: envelope.data }
    }
    if (innerStatus === 'error') {
      return {
        ok: false,
        message: extractErrorMessage(envelope),
        code: innerStatus,
      }
    }
  }

  const topStatus = String(json.status ?? '')
  if (topStatus === 'success') {
    return { ok: true, data: json.data }
  }

  return {
    ok: false,
    message: extractErrorMessage(json),
    code: topStatus,
  }
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            data: {
              method: 'user_refresh',
              object_data: { refresh_token: refreshToken },
            },
          }),
        })

        const json = (await response.json()) as RawJson
        const parsed = unwrapApiPayload(json)
        if (!parsed.ok || !response.ok) {
          clearTokens()
          return null
        }

        const payload = parsed.data as Record<string, unknown>
        const access = String(payload.access_token ?? '')
        const refresh = String(payload.refresh_token ?? refreshToken)
        if (!access) {
          clearTokens()
          return null
        }

        setTokens(access, refresh)
        return access
      } catch {
        clearTokens()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

interface CallMethodOptions {
  auth?: boolean
  retry?: boolean
}

export async function callMethod<T>(
  method: string,
  objectData: object = {},
  options: CallMethodOptions = {},
): Promise<T> {
  const { auth = true, retry = true } = options
  const accessToken = auth ? getAccessToken() : null

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      data: {
        method,
        object_data: objectData,
      },
    }),
  })

  if (response.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return callMethod<T>(method, objectData, { auth, retry: false })
    }
    throw new ApiClientError('Session expired. Please sign in again.', 401)
  }

  const json = (await response.json()) as ApiResponse<T | ApiErrorData> & RawJson
  const parsed = unwrapApiPayload(json)

  if (!parsed.ok) {
    throw new ApiClientError(parsed.message, response.status, parsed.code)
  }
  if (!response.ok) {
    throw new ApiClientError('Request failed', response.status)
  }

  return parsed.data as T
}
