import { type QueryClient, useSuspenseQuery } from '@tanstack/react-query'

import type { GenerativeRecipeData } from '@/components/recipes/RecipeCard'

export type RouteName = 'chat' | 'kitchen' | 'recipes' | 'planner'

export type ChatMessageContent = string | RecipeMessage

export interface RecipeMessage {
  type: 'recipe'
  data: GenerativeRecipeData
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  timestamp: string
  content: ChatMessageContent
}

interface ChatRouteData {
  quickPrompts: Array<{ title: string; description: string; icon: string }>
  pinnedThreads: Array<{ id: string; title: string; lastActivity: string }>
  messages: ChatMessage[]
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
    messages: [
      {
        id: 'msg-001',
        role: 'user',
        timestamp: '2 minutes ago',
        content:
          'I have two salmon fillets, a sous-vide setup, and a countertop torch. Can you suggest something bright with citrus?',
      },
      {
        id: 'msg-002',
        role: 'assistant',
        timestamp: 'Just now',
        content: {
          type: 'recipe',
          data: {
            id: 'recipe-ai-citrus-salmon',
            title: 'Citrus Torch-Seared Salmon with Miso Glaze',
            description:
              'A sous-vide baseline for silky salmon finished under a torch with a blood-orange miso glaze and crisped aromatics.',
            cuisine: 'Pacific Northwest',
            tags: ['sous-vide', 'gluten-free', 'omega rich'],
            totalMinutes: 45,
            difficulty: 'moderate',
            servings: 2,
            heroImageUrl:
              'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80',
            instructions: [
              '1. Preheat your sous-vide bath to **50°C (122°F)**.',
              '2. Whisk miso paste, honey, rice vinegar, and blood orange zest until smooth; reserve half for glazing.',
              '3. Season salmon with salt, seal with half the miso mixture and thyme, then cook sous-vide for 30 minutes.',
              '4. While it cooks, prep salad: shave fennel, segment citrus, and toss with olive oil and flaky salt.',
              '5. Remove fillets, pat dry, brush with remaining glaze, and torch until the surface caramelizes.',
              '6. Plate over fennel-citrus salad, finishing with micro herbs and a final drizzle of glaze.',
            ].join('\n'),
            ingredients: [
              {
                id: 'section-protein',
                title: 'Protein & Marinade',
                items: [
                  {
                    id: 'ingredient-salmon',
                    name: 'Salmon fillets',
                    quantity: '2 × 150 g portions',
                    note: 'Pin bones removed, skin on',
                  },
                  {
                    id: 'ingredient-miso',
                    name: 'White miso paste',
                    quantity: '2 tablespoons',
                  },
                  {
                    id: 'ingredient-honey',
                    name: 'Wildflower honey',
                    quantity: '1 tablespoon',
                  },
                  {
                    id: 'ingredient-vinegar',
                    name: 'Rice vinegar',
                    quantity: '1 teaspoon',
                  },
                  {
                    id: 'ingredient-zest',
                    name: 'Blood orange zest',
                    quantity: 'Zest of 1 orange',
                    note: 'Reserve juice for salad',
                  },
                  {
                    id: 'ingredient-thyme',
                    name: 'Fresh thyme sprigs',
                    quantity: '2 sprigs',
                  },
                ],
              },
              {
                id: 'section-salad',
                title: 'Citrus Fennel Salad',
                items: [
                  {
                    id: 'ingredient-fennel',
                    name: 'Fennel bulb',
                    quantity: '1 small, shaved thin',
                  },
                  {
                    id: 'ingredient-orange',
                    name: 'Blood orange segments',
                    quantity: '1 whole orange',
                  },
                  {
                    id: 'ingredient-microgreens',
                    name: 'Micro herbs or dill fronds',
                    quantity: 'A small handful',
                  },
                  {
                    id: 'ingredient-oliveoil',
                    name: 'Extra-virgin olive oil',
                    quantity: '1 tablespoon',
                  },
                  {
                    id: 'ingredient-salt',
                    name: 'Flaky sea salt',
                    quantity: 'To taste',
                  },
                ],
              },
              {
                id: 'section-finish',
                title: 'To Finish',
                items: [
                  {
                    id: 'ingredient-torch',
                    name: 'Kitchen torch',
                    note: 'For caramelizing the glaze',
                  },
                  {
                    id: 'ingredient-juice',
                    name: 'Reserved blood orange juice',
                    quantity: '1 tablespoon',
                  },
                ],
              },
            ],
          },
        },
      },
      {
        id: 'msg-003',
        role: 'assistant',
        timestamp: 'Just now',
        content:
          'Torch the glaze from about 5 cm away for even caramelization. Let the salmon rest for a minute before plating so the glaze sets.',
      },
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
