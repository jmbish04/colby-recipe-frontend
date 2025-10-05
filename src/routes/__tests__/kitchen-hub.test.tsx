import { vi, describe, beforeEach, afterEach, it, expect, type MockInstance } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/react'

import KitchenHubRoute from '@/routes/kitchen-hub'
import { renderKitchenHub } from '@/test/test-utils'
import type { Appliance } from '@/hooks/useAppliances'

const baseTimestamp = new Date('2025-02-15T18:00:00.000Z').toISOString()

describe('KitchenHubRoute appliance manager', () => {
  let fetchSpy: MockInstance<typeof fetch>
  let serverAppliances: Appliance[]

  beforeEach(() => {
    serverAppliances = [
      {
        id: 'appliance-1',
        brand: 'Anova',
        model: 'Precision Oven',
        nickname: 'Steam oven',
        status: 'ready',
        uploadedAt: baseTimestamp,
        updatedAt: baseTimestamp,
        manualFileName: 'anova-precision-oven.pdf',
        manualUrl: 'https://manuals.menuforge.app/appliance-1/anova.pdf',
        processingProgress: 100,
      },
      {
        id: 'appliance-2',
        brand: 'Breville',
        model: 'Control Freak',
        nickname: null,
        status: 'processing',
        uploadedAt: baseTimestamp,
        updatedAt: baseTimestamp,
        manualFileName: 'breville.pdf',
        manualUrl: null,
        processingProgress: 38,
      },
    ]

    fetchSpy = vi.spyOn(globalThis, 'fetch') as MockInstance<typeof fetch>

    fetchSpy.mockImplementation(async (...args) => {
      const [input, init] = args
      const url = typeof input === 'string' || input instanceof URL ? new URL(input.toString(), 'http://localhost') : new URL(input.url)
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET')

      if (url.pathname === '/api/kitchen/appliances' && method === 'GET') {
        return new Response(JSON.stringify({ appliances: serverAppliances }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (url.pathname === '/api/kitchen/appliances' && method === 'POST') {
        const newAppliance: Appliance = {
          id: 'appliance-3',
          brand: 'GE Profile',
          model: 'Smart Wall Oven',
          nickname: 'Wall oven',
          status: 'processing',
          uploadedAt: baseTimestamp,
          updatedAt: baseTimestamp,
          manualFileName: 'ge-profile.pdf',
          manualUrl: null,
          processingProgress: 24,
        }
        serverAppliances = [newAppliance, ...serverAppliances]

        return new Response(JSON.stringify({ appliance: newAppliance }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (url.pathname.startsWith('/api/kitchen/appliances/') && method === 'DELETE') {
        const applianceId = url.pathname.split('/').pop() ?? ''
        serverAppliances = serverAppliances.filter((item) => item.id !== applianceId)

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } })
    })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  const wasCalledWith = (method: string, path: string) =>
    fetchSpy.mock.calls.some(([rawInput, rawInit]: Parameters<typeof fetch>) => {
      const input = rawInput as RequestInfo | URL
      const init = rawInit as RequestInit | undefined
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input)
      const actualMethod = init?.method ?? (input instanceof Request ? input.method : 'GET')
      return url.includes(path) && actualMethod === method
    })

  it('renders the appliance list once loaded', async () => {
    renderKitchenHub(<KitchenHubRoute />)

    expect(await screen.findByText('Anova')).toBeInTheDocument()
    expect(screen.getByText('Control Freak')).toBeInTheDocument()
    expect(wasCalledWith('GET', '/api/kitchen/appliances')).toBe(true)
  })

  it('allows adding a new appliance via the dialog', async () => {
    const user = userEvent.setup()
    renderKitchenHub(<KitchenHubRoute />)

    await screen.findByText('Anova')

    await user.click(screen.getByRole('button', { name: /add appliance/i }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/brand/i), 'GE Profile')
    await user.type(within(dialog).getByLabelText(/model/i), 'Smart Wall Oven')
    const file = new File(['pdf'], 'ge-profile.pdf', { type: 'application/pdf' })
    await user.upload(within(dialog).getByLabelText(/manual/i), file)
    await user.type(within(dialog).getByLabelText(/nickname/i), 'Wall oven')

    await user.click(within(dialog).getByRole('button', { name: /add appliance/i }))

    expect(await screen.findByText('GE Profile')).toBeInTheDocument()
    await waitFor(() => {
      expect(wasCalledWith('POST', '/api/kitchen/appliances')).toBe(true)
    })
  })

  it('confirms and deletes an appliance', async () => {
    const user = userEvent.setup()
    renderKitchenHub(<KitchenHubRoute />)

    await screen.findByText('Anova')

    await user.click(screen.getByLabelText(/remove Anova Precision Oven/i))
    const alert = await screen.findByRole('alertdialog')
    await user.click(within(alert).getByRole('button', { name: /remove appliance/i }))

    await waitFor(() => {
      expect(screen.queryByText('Anova')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(wasCalledWith('DELETE', '/api/kitchen/appliances/appliance-1')).toBe(true)
    })
  })
})
