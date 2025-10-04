import { useMemo } from 'react'

import { useAuthStore } from '@/stores/useAuthStore'

const DEFAULT_API_BASE_URL = 'https://colby-recipe-backend.hacolby.workers.dev'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

export class ApiError<T = unknown> extends Error {
  constructor(message: string, public status: number, public data?: T) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

async function parseJson(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function refreshAccessToken(signal?: AbortSignal) {
  const { refreshToken, setSession, logout } = useAuthStore.getState()

  if (!refreshToken) {
    throw new ApiError('Session expired', 401)
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    signal,
  })

  const data = await parseJson(response)

  if (!response.ok) {
    logout()
    throw new ApiError((data as { message?: string })?.message ?? 'Unable to refresh session', response.status, data)
  }

  const { accessToken, refreshToken: nextRefreshToken, expiresIn } = (data ?? {}) as {
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }

  setSession({ accessToken, refreshToken: nextRefreshToken ?? refreshToken, expiresIn })
  return accessToken
}

function buildUrl(path: string, query?: ApiRequestOptions['query']) {
  const url = path.startsWith('http') ? new URL(path) : new URL(path, API_BASE_URL)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      url.searchParams.set(key, String(value))
    })
  }

  return url
}

async function request<T>(path: string, options: ApiRequestOptions = {}) {
  const {
    method = 'GET',
    body,
    headers: initialHeaders,
    auth = true,
    query,
    signal,
  } = options

  const url = buildUrl(path, query)
  const headers = new Headers(initialHeaders)
  const authState = useAuthStore.getState()

  const shouldAttachAuth = auth && authState.accessToken
  if (shouldAttachAuth) {
    headers.set('authorization', `Bearer ${authState.accessToken}`)
  }

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined && body !== null) {
    headers.set('content-type', 'application/json')
    payload = JSON.stringify(body)
  }

  const requiresRefresh =
    auth &&
    authState.accessTokenExpiresAt !== null &&
    authState.accessTokenExpiresAt - Date.now() < 60_000

  if (requiresRefresh) {
    await refreshAccessToken(signal)
    headers.set('authorization', `Bearer ${useAuthStore.getState().accessToken}`)
  }

  let response = await fetch(url, { method, body: payload, headers, signal })

  if (response.status === 401 && auth) {
    try {
      const refreshedToken = await refreshAccessToken(signal)
      headers.set('authorization', `Bearer ${refreshedToken}`)
      response = await fetch(url, { method, body: payload, headers, signal })
    } catch (error) {
      // The `refreshAccessToken` function already handles logging out on failure.
      throw error
    }
  }

  const data = (await parseJson(response)) as T

  if (!response.ok) {
    const message = (data as { message?: string })?.message ?? `Request to ${url.pathname} failed`
    throw new ApiError(message, response.status, data)
  }

  return data
}

export function useApi() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)

  return useMemo(
    () => {
      void accessToken
      void refreshToken

      return {
        get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) => request<T>(path, { ...options, method: 'GET' }),
        post: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) => request<T>(path, { ...options, method: 'POST' }),
        put: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) => request<T>(path, { ...options, method: 'PUT' }),
        patch: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) => request<T>(path, { ...options, method: 'PATCH' }),
        delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) => request<T>(path, { ...options, method: 'DELETE' }),
        request,
      }
    },
    [accessToken, refreshToken],
  )
}

export { request }
