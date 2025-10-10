import { API_BASE_URL, ApiError } from '@/lib/api'

export interface StreamEvent {
  event: string
  data: string
}

export interface StreamHandlers {
  onEvent: (event: StreamEvent) => void
  onClose?: () => void
}

export interface StreamRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

function encodeBody(body: unknown, headers: Headers) {
  if (body === undefined || body === null) {
    return undefined
  }

  if (body instanceof FormData) {
    return body
  }

  if (typeof body === 'string' || body instanceof Blob) {
    return body
  }

  headers.set('content-type', 'application/json')
  return JSON.stringify(body)
}

export async function streamApi(
  path: string,
  handlers: StreamHandlers,
  options: StreamRequestOptions = {},
): Promise<void> {
  const { method = 'POST', body, headers: initialHeaders, signal } = options
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers = new Headers(initialHeaders)
  if (!headers.has('accept')) {
    headers.set('accept', 'text/event-stream')
  }
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'no-store')
  }

  const payload = encodeBody(body, headers)

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
    signal,
  })

  if (!response.ok || !response.body) {
    const message = `Streaming request to ${url} failed`
    throw new ApiError(message, response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    let isDone = false
    while (!isDone) {
      const { value, done } = await reader.read()
      if (done) {
        if (buffer.trim()) {
          processBuffer(buffer, handlers)
        }
        handlers.onClose?.()
        isDone = true
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const boundaryIndex = buffer.lastIndexOf('\n\n')
      if (boundaryIndex !== -1) {
        const chunk = buffer.slice(0, boundaryIndex + 2)
        processBuffer(chunk, handlers)
        buffer = buffer.slice(boundaryIndex + 2)
      }
    }
  } catch (error) {
    reader.releaseLock()
    throw error
  }
}

function processBuffer(buffer: string, handlers: StreamHandlers) {
  const entries = buffer.split(/\n\n/)

  entries
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const lines = entry.split('\n')
      let eventName = 'message'
      const dataLines: string[] = []

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim())
        }
      }

      handlers.onEvent({ event: eventName, data: dataLines.join('\n') })
    })
}
