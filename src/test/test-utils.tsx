import { Suspense, type ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { KitchenRouteData } from '@/lib/routeData'

const defaultKitchenRouteData: KitchenRouteData = {
  recipe: {
    id: 'recipe-001',
    title: 'Sous-vide miso salmon',
    summary: 'Precise temperature control paired with a citrus glaze and crispy finish.',
    cookTime: '45 min',
    servings: 2,
    tags: ['sous-vide', 'weeknight', 'omega rich'],
    completion: 68,
  },
  pantry: [
    { name: 'Fresh salmon fillet', quantity: '2 x 150g portions', pantryStatus: 'low' },
    { name: 'White miso paste', quantity: '3 tbsp', pantryStatus: 'available' },
  ],
  prepSections: [
    {
      title: 'Water bath warmup',
      details: 'Bring the sous-vide bath to 50°C. Assemble miso marinade and seal the salmon.',
    },
    {
      title: 'Finish & plate',
      details: 'Torch for caramelization, glaze with reduced marinade, and plate with citrus.',
    },
  ],
  recommendedPairings: [
    { title: 'Yuzu spritz', note: 'Bright sparkling cocktail mirroring the marinade acidity.' },
    { title: 'Rice cooker farro', note: 'Whole-grain base using appliance aware mode.' },
  ],
}

interface RenderOptions {
  routeData?: KitchenRouteData
}

export function renderKitchenHub(ui: ReactElement, { routeData }: RenderOptions = {}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  client.setQueryData(['route-data', 'kitchen'], routeData ?? defaultKitchenRouteData)

  return {
    ...render(
      <MemoryRouter initialEntries={['/kitchen']}>
        <QueryClientProvider client={client}>
          <Suspense fallback={<div>Loading…</div>}>{ui}</Suspense>
        </QueryClientProvider>
      </MemoryRouter>,
    ),
    queryClient: client,
  }
}
