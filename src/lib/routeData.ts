import { type QueryClient, useSuspenseQuery } from '@tanstack/react-query'

export type RouteName = 'chat' | 'kitchen' | 'recipes' | 'planner'

interface ChatRouteData {
  quickPrompts: Array<{ title: string; description: string; icon: string }>
  pinnedThreads: Array<{ id: string; title: string; lastActivity: string }>
}

interface KitchenRouteData {
  recipe: {
    id: string
    title: string
    summary: string
    cookTime: string
    servings: number
    tags: string[]
    completion: number
  }
  pantry: Array<{ name: string; quantity: string; pantryStatus: 'available' | 'low' | 'missing' }>
  prepSections: Array<{ title: string; details: string }>
  recommendedPairings: Array<{ title: string; note: string }>
}

interface RecipesRouteData {
  featured: Array<{
    id: string
    title: string
    summary: string
    badges: string[]
  }>
  insights: Array<{ label: string; value: string }>
}

interface PlannerRouteData {
  upcomingMeals: Array<{
    id: string
    title: string
    day: string
    time: string
    appliances: string[]
  }>
  suggestions: Array<{ title: string; description: string }>
}

type RouteDataMap = {
  chat: ChatRouteData
  kitchen: KitchenRouteData
  recipes: RecipesRouteData
  planner: PlannerRouteData
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const DATA: RouteDataMap = {
  chat: {
    quickPrompts: [
      {
        title: 'Deconstruct tonight\'s menu',
        description: 'Get prep sequences aligned to your appliances and pantry inventory.',
        icon: '🧪',
      },
      {
        title: 'Smart substitution',
        description: 'Swap ingredients based on what\'s fresh and seasonal.',
        icon: '♻️',
      },
      {
        title: 'Voice mise en place',
        description: 'Record a voice memo and we\'ll transcribe the prep list instantly.',
        icon: '🎙️',
      },
    ],
    pinnedThreads: [
      {
        id: 'thread-001',
        title: 'AI Sous Chef — New Year\'s tasting menu',
        lastActivity: 'Active 2h ago',
      },
      { id: 'thread-002', title: 'Grill diagnostics with SmartFire', lastActivity: 'Updated yesterday' },
    ],
  },
  kitchen: {
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
      { name: 'Blood orange', quantity: '1 whole', pantryStatus: 'missing' },
      { name: 'Spring onions', quantity: '2 stalks', pantryStatus: 'missing' },
    ],
    prepSections: [
      {
        title: 'Water bath warmup',
        details: 'Bring the sous-vide bath to 50°C. Assemble miso marinade and seal the salmon.',
      },
      {
        title: 'Infuse & chill',
        details: 'Marinate sealed fish for 20 minutes while prepping aromatics.',
      },
      {
        title: 'Finish & plate',
        details: 'Torch for caramelization, glaze with reduced marinade, and plate with citrus.',
      },
    ],
    recommendedPairings: [
      { title: 'Yuzu spritz', note: 'Bright sparkling cocktail mirroring the marinade acidity.' },
      { title: 'Shaved fennel salad', note: 'Crunchy counterpoint with a citrus dressing.' },
      { title: 'Rice cooker farro', note: 'Whole-grain base using appliance aware mode.' },
    ],
  },
  recipes: {
    featured: [
      {
        id: 'recipe-104',
        title: 'Charred leek risotto',
        summary: 'Induction-friendly risotto with pressure-steam finish.',
        badges: ['Induction', '30 min'],
      },
      {
        id: 'recipe-105',
        title: 'Cold smoked ribeye',
        summary: 'Low-temp smoke pairing with sous-vide reheat and cast-iron sear.',
        badges: ['Smoking', 'Weekend project'],
      },
      {
        id: 'recipe-106',
        title: 'Compressed melon salad',
        summary: 'Vacuum-infused melon with mint oil and citrus pearls.',
        badges: ['Seasonal', 'No-cook'],
      },
    ],
    insights: [
      { label: 'Most requested appliance', value: 'Combi-steam oven' },
      { label: 'Average completion rate', value: '82%' },
      { label: 'Tailored recipes this week', value: '14' },
    ],
  },
  planner: {
    upcomingMeals: [
      {
        id: 'planner-001',
        title: 'Seared scallop ramen',
        day: 'Thursday',
        time: '7:30 PM',
        appliances: ['Combi-steam', 'Induction'],
      },
      {
        id: 'planner-002',
        title: 'Charcoal grilled peaches',
        day: 'Friday',
        time: '6:00 PM',
        appliances: ['SmartFire grill'],
      },
      {
        id: 'planner-003',
        title: 'Midnight snack platter',
        day: 'Saturday',
        time: '10:00 PM',
        appliances: ['AI Sous Chef'],
      },
    ],
    suggestions: [
      {
        title: 'Auto-generate weekend brunch',
        description: 'Let the planner build a seasonal brunch with pantry-aware deduping.',
      },
      {
        title: 'Sync grocery delivery',
        description: 'Push next week\'s menu to your delivery service with one tap.',
      },
    ],
  },
}

const routeQueryKey = (name: RouteName) => ['route-data', name]

const createFetcher = <T extends RouteName>(name: T) => async () => {
  await delay(120)
  return structuredClone(DATA[name]) as RouteDataMap[T]
}

const fetchers: { [K in RouteName]: () => Promise<RouteDataMap[K]> } = {
  chat: createFetcher('chat'),
  kitchen: createFetcher('kitchen'),
  recipes: createFetcher('recipes'),
  planner: createFetcher('planner'),
}

export function prefetchRouteData<T extends RouteName>(client: QueryClient, name: T) {
  const fetcher = fetchers[name] as () => Promise<RouteDataMap[T]>

  return client.prefetchQuery({
    queryKey: routeQueryKey(name),
    queryFn: fetcher,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRouteData<T extends RouteName>(name: T) {
  const fetcher = fetchers[name] as () => Promise<RouteDataMap[T]>

  return useSuspenseQuery<RouteDataMap[T]>({
    queryKey: routeQueryKey(name),
    queryFn: fetcher,
    staleTime: 1000 * 60 * 5,
  })
}

export type {
  ChatRouteData,
  KitchenRouteData,
  RecipesRouteData,
  PlannerRouteData,
}
