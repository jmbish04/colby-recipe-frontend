import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

const warn = console.warn
const error = console.error
let warnSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeAll(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation((message?: unknown, ...args: unknown[]) => {
    if (
      typeof message === 'string' &&
      (message.includes('React Router Future Flag Warning') ||
        message.includes('A component is changing an uncontrolled input to be controlled'))
    ) {
      return
    }

    warn(message as never, ...(args as never[]))
  })

  errorSpy = vi.spyOn(console, 'error').mockImplementation((message?: unknown, ...args: unknown[]) => {
    if (typeof message === 'string' && message.includes('A component is changing an uncontrolled input to be controlled')) {
      return
    }

    error(message as never, ...(args as never[]))
  })
})

afterAll(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
})
