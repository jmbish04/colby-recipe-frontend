import { describe, beforeEach, afterEach, it, expect, vi, type MockInstance } from 'vitest'
import type { ReactElement } from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import RecipesRoute from '@/routes/recipes'
import RecipeDetailRoute from '@/routes/recipes/detail'
import type { RecipeDetail, RecipePayload, RecipeSummary } from '@/hooks/useRecipes'

const now = new Date('2025-03-01T12:00:00.000Z').toISOString()

const recipeSummary: RecipeSummary = {
  id: 'recipe-precision-bread',
  title: 'Precision Steam Bread',
  summary: 'Loaf tuned for steam ovens with elastic crumb.',
  cuisine: 'Nordic',
  difficulty: 'moderate',
  totalMinutes: 90,
  servings: 6,
  tags: ['steam', 'bread'],
  thumbnailUrl: 'https://example.com/image.jpg',
  createdAt: now,
  updatedAt: now,
}

const recipeDetail: RecipeDetail = {
  ...recipeSummary,
  ingredients: ['500g flour', '10g salt', '320g water'],
  instructions: ['Mix ingredients', 'Ferment for 3 hours', 'Bake with steam'],
  equipment: ['Steam oven', 'Dutch oven'],
}

describe('Recipes routes', () => {
  let fetchSpy: MockInstance<typeof fetch>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch') as MockInstance<typeof fetch>
    fetchSpy.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const url = new URL(request.url, 'http://localhost')
      const method = request.method || 'GET'

      if (url.pathname === '/api/recipes' && method === 'GET') {
        return new Response(JSON.stringify({ recipes: [recipeSummary] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (url.pathname === `/api/recipes/${recipeDetail.id}` && method === 'GET') {
        return new Response(JSON.stringify({ recipe: recipeDetail }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (url.pathname === `/api/recipes/${recipeDetail.id}` && method === 'PUT') {
        const body = JSON.parse(await request.text()) as RecipePayload
        recipeDetail.title = body.title
        recipeDetail.summary = body.summary
        return new Response(JSON.stringify({ recipe: recipeDetail }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (url.pathname === `/api/recipes/${recipeDetail.id}` && method === 'DELETE') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  function renderWithProviders(ui: ReactElement, initialEntry: string) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
      </MemoryRouter>,
    )
  }

  function wasCalled(method: string, path: string) {
    return fetchSpy.mock.calls.some(([rawInput, rawInit]) => {
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
  }

  it('renders recipe cards after loading data', async () => {
    renderWithProviders(<RecipesRoute />, '/recipes')

    expect(await screen.findByText('Precision Steam Bread')).toBeInTheDocument()
    expect(screen.getByText('Loaf tuned for steam ovens with elastic crumb.')).toBeInTheDocument()
    expect(wasCalled('GET', '/api/recipes')).toBe(true)
  })

  it('shows recipe details with tabbed content and allows editing title', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/recipes/:id" element={<RecipeDetailRoute />} />
      </Routes>,
      `/recipes/${recipeDetail.id}`,
    )

    expect(await screen.findByRole('heading', { name: 'Precision Steam Bread' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /instructions/i }))
    const instructionSteps = await screen.findAllByText(/mix ingredients/i)
    expect(instructionSteps.length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const titleInput = await screen.findByLabelText('Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Steam Bread')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(wasCalled('PUT', `/api/recipes/${recipeDetail.id}`)).toBe(true)
    })

    expect(await screen.findByRole('heading', { name: 'Updated Steam Bread' })).toBeInTheDocument()
  })
})
