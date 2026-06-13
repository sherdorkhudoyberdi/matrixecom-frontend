import { callMethod } from '@/api/client'
import type { AuthTokens, User } from '@/types/api'

export interface LoginPayload {
  login: string
  password: string
}

export interface RegisterPayload {
  login: string
  password: string
  phone?: string
  first_name?: string
  last_name?: string
}

export function login(payload: LoginPayload) {
  return callMethod<AuthTokens>('user_login', payload, { auth: false })
}

export function register(payload: RegisterPayload) {
  return callMethod<AuthTokens>('user_register', payload, { auth: false })
}

export function refresh(refreshToken: string) {
  return callMethod<AuthTokens>(
    'user_refresh',
    { refresh_token: refreshToken },
    { auth: false },
  )
}

export function me() {
  return callMethod<{ user: User }>('auth_me')
}
