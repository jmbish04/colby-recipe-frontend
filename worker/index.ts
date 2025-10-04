/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher
}

const API_PREFIX = '/api'
const ACCESS_TOKEN_PREFIX = 'mock-access-token-'
const REFRESH_TOKEN_PREFIX = 'mock-refresh-token-'

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null

function jsonResponse(data: JsonValue, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  headers.set('cache-control', 'no-store')

  return new Response(JSON.stringify(data), {
    ...init,
    status: init?.status ?? 200,
    headers,
  })
}

function errorResponse(status: number, message: string) {
  return jsonResponse({ message }, { status })
}

async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.clone().json()) as T
  } catch (error) {
    console.error('Failed to parse JSON payload', error)
    return null
  }
}

function encodeToken(prefix: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const encoded = btoa(normalizedEmail)
  const nonce = crypto.randomUUID()
  return `${prefix}${encoded}.${nonce}`
}

function decodeToken(prefix: string, token: string) {
  if (!token.startsWith(prefix)) {
    return null
  }

  const encoded = token.slice(prefix.length).split('.')[0]

  try {
    return atob(encoded)
  } catch (error) {
    console.error('Failed to decode token payload', error)
    return null
  }
}

async function buildUserProfile(email: string) {
  const [localPart] = email.split('@')
  const name = localPart
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

  const sanitizedId = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'demo'

  const roles = email.endsWith('@menuforge.app') ? ['admin', 'member'] : ['member']

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()))
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')

  return {
    id: `user-${sanitizedId}`,
    email,
    name: name || 'MenuForge Member',
    avatarUrl: `https://www.gravatar.com/avatar/${hash}?d=identicon`,
    roles,
  }
}

async function handleLogin(request: Request) {
  type LoginPayload = { email?: string; password?: string }

  const body = await parseJsonBody<LoginPayload>(request)
  if (!body) {
    return errorResponse(400, 'Invalid JSON payload provided')
  }

  const { email, password } = body

  if (typeof email !== 'string' || !email.includes('@')) {
    return errorResponse(400, 'A valid email address is required')
  }

  if (typeof password !== 'string' || password.length < 6) {
    return errorResponse(400, 'Password must be at least 6 characters long')
  }

  if (password === 'invalid') {
    return errorResponse(401, 'Invalid email or password')
  }

  const accessToken = encodeToken(ACCESS_TOKEN_PREFIX, email)
  const refreshToken = encodeToken(REFRESH_TOKEN_PREFIX, email)
  const user = await buildUserProfile(email)

  return jsonResponse({ accessToken, refreshToken, expiresIn: 15 * 60, user }, { status: 200 })
}

async function handleRefresh(request: Request) {
  type RefreshPayload = { refreshToken?: string }

  const body = await parseJsonBody<RefreshPayload>(request)
  if (!body) {
    return errorResponse(400, 'Invalid JSON payload provided')
  }

  const { refreshToken } = body

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return errorResponse(400, 'Refresh token is required')
  }

  const email = decodeToken(REFRESH_TOKEN_PREFIX, refreshToken)

  if (!email) {
    return errorResponse(401, 'Session could not be refreshed')
  }

  const accessToken = encodeToken(ACCESS_TOKEN_PREFIX, email)
  const nextRefreshToken = encodeToken(REFRESH_TOKEN_PREFIX, email)

  return jsonResponse({ accessToken, refreshToken: nextRefreshToken, expiresIn: 15 * 60 }, { status: 200 })
}

async function handleCurrentUser(request: Request) {
  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return errorResponse(401, 'Authorization header is missing')
  }

  const [scheme, token] = authorization.split(' ')

  if (!token || scheme.toLowerCase() !== 'bearer') {
    return errorResponse(401, 'Authorization header is malformed')
  }

  const email = decodeToken(ACCESS_TOKEN_PREFIX, token)

  if (!email) {
    return errorResponse(401, 'Session has expired')
  }

  const user = await buildUserProfile(email)

  return jsonResponse({ user }, { status: 200 })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === `${API_PREFIX}/health`) {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        {
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
          },
        },
      )
    }

    if (url.pathname === `${API_PREFIX}/auth/login`) {
      if (request.method !== 'POST') {
        return errorResponse(405, 'Method Not Allowed')
      }

      return handleLogin(request)
    }

    if (url.pathname === `${API_PREFIX}/auth/refresh`) {
      if (request.method !== 'POST') {
        return errorResponse(405, 'Method Not Allowed')
      }

      return handleRefresh(request)
    }

    if (url.pathname === `${API_PREFIX}/auth/me`) {
      if (request.method !== 'GET') {
        return errorResponse(405, 'Method Not Allowed')
      }

      return handleCurrentUser(request)
    }

    if (url.pathname.startsWith(API_PREFIX)) {
      return errorResponse(404, 'Endpoint not implemented in mock worker')
    }

    return env.ASSETS.fetch(request)
  },
}
