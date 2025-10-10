/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher
}

const API_PREFIX = '/api'
const ACCESS_TOKEN_PREFIX = 'mock-access-token-'
const REFRESH_TOKEN_PREFIX = 'mock-refresh-token-'

type ApplianceStatus = 'queued' | 'processing' | 'ready' | 'error'

type RecipeDifficulty = 'easy' | 'moderate' | 'advanced'

interface RecipeRecord {
  id: string
  title: string
  summary: string
  cuisine: string
  difficulty: RecipeDifficulty
  totalMinutes: number
  servings: number
  tags: string[]
  thumbnailUrl: string
  createdAt: string
  updatedAt: string
  ingredients: string[]
  instructions: string[]
  equipment: string[]
}

interface ApplianceRecord {
  id: string
  brand: string
  model: string
  nickname?: string
  status: ApplianceStatus
  uploadedAt: string
  updatedAt: string
  manualFileName?: string | null
  manualUrl?: string | null
  processingProgress?: number
  statusDetail?: string | null
  processingOutcome?: 'success' | 'error'
  failureReason?: string | null
}

const appliancesStore = new Map<string, ApplianceRecord>()
const processingTimers = new Map<string, ReturnType<typeof setTimeout>[]>()
const MANUAL_CDN_BASE = 'https://manuals.menuforge.app'

const recipesStore = new Map<string, RecipeRecord>()

interface RecipeFlowchartRecord {
  recipeId: string
  mermaid: string
  summary: string
  updatedAt: string
  recommendedAppliances: string[]
}

interface TailoredInstructionBlockRecord {
  id: string
  title: string
  content: string
  applianceContext: string
  order: number
  durationMinutes?: number
}

interface TailoredRecipeRunRecord {
  runId: string
  recipeId: string
  applianceIds: string[]
  startedAt: string
  completedAt?: string
  status: 'streaming' | 'complete' | 'error'
  summary: string
  recommendedAppliances: string[]
  blocks: TailoredInstructionBlockRecord[]
  errorMessage?: string
}

const recipeFlowchartStore = new Map<string, RecipeFlowchartRecord>()
const tailorHistoryStore = new Map<string, TailoredRecipeRunRecord[]>()

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

function serializeAppliance(record: ApplianceRecord) {
  return {
    id: record.id,
    brand: record.brand,
    model: record.model,
    nickname: record.nickname ?? null,
    status: record.status,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt,
    manualFileName: record.manualFileName ?? null,
    manualUrl: record.manualUrl ?? null,
    processingProgress: record.processingProgress ?? null,
    statusDetail: record.statusDetail ?? null,
  }
}

function scheduleProcessing(record: ApplianceRecord) {
  const existingTimers = processingTimers.get(record.id)
  existingTimers?.forEach((timer) => clearTimeout(timer))

  const timers: ReturnType<typeof setTimeout>[] = []
  record.processingOutcome = record.processingOutcome ?? 'success'
  record.status = 'queued'
  record.statusDetail = null
  record.processingProgress = 0
  record.manualUrl = null
  record.updatedAt = new Date().toISOString()

  timers.push(
    setTimeout(() => {
      record.status = 'processing'
      record.processingProgress = 24
      record.updatedAt = new Date().toISOString()
    }, 700),
  )

  timers.push(
    setTimeout(() => {
      if (record.status === 'processing') {
        record.processingProgress = 62
        record.updatedAt = new Date().toISOString()
      }
    }, 1500),
  )

  timers.push(
    setTimeout(() => {
      const outcome = record.processingOutcome ?? 'success'
      record.updatedAt = new Date().toISOString()

      if (outcome === 'error') {
        record.status = 'error'
        record.processingProgress = 100
        record.manualUrl = null
        record.statusDetail =
          record.failureReason ?? 'Manual processing failed. Try again or upload a clearer PDF.'
      } else {
        record.status = 'ready'
        record.processingProgress = 100
        record.manualUrl = `${MANUAL_CDN_BASE}/${record.id}/${encodeURIComponent(
          record.manualFileName ?? 'manual.pdf',
        )}`
        record.statusDetail = null
        record.failureReason = null
      }

      processingTimers.delete(record.id)
    }, record.processingOutcome === 'error' ? 2800 : 2200),
  )

  processingTimers.set(record.id, timers)
}

function clearProcessingTimers(applianceId: string) {
  const timers = processingTimers.get(applianceId)
  if (timers) {
    timers.forEach((timer) => clearTimeout(timer))
    processingTimers.delete(applianceId)
  }
}

function ensureSeedAppliances() {
  if (appliancesStore.size > 0) {
    return
  }

  const now = new Date().toISOString()
  const readyAppliance: ApplianceRecord = {
    id: 'appliance-001',
    brand: 'Anova',
    model: 'Precision Oven',
    nickname: 'Steam oven',
    status: 'ready',
    uploadedAt: now,
    updatedAt: now,
    manualFileName: 'anova-precision-oven.pdf',
    manualUrl: `${MANUAL_CDN_BASE}/appliance-001/anova-precision-oven.pdf`,
    processingProgress: 100,
    statusDetail: null,
    processingOutcome: 'success',
  }

  const processingAppliance: ApplianceRecord = {
    id: 'appliance-002',
    brand: 'Breville',
    model: 'Control Freak',
    nickname: 'Induction hob',
    status: 'queued',
    uploadedAt: now,
    updatedAt: now,
    manualFileName: 'breville-control-freak.pdf',
    manualUrl: null,
    processingProgress: 0,
    statusDetail: null,
    processingOutcome: 'success',
  }

  const failedAppliance: ApplianceRecord = {
    id: 'appliance-003',
    brand: 'KitchenAid',
    model: 'Smart Oven+',
    nickname: 'Lab test unit',
    status: 'error',
    uploadedAt: now,
    updatedAt: now,
    manualFileName: 'kitchenaid-smart-oven.pdf',
    manualUrl: null,
    processingProgress: 100,
    statusDetail: 'Manual ingestion failed. Retry processing to rebuild capabilities.',
    processingOutcome: 'error',
    failureReason: 'Manual ingestion failed. Retry processing to rebuild capabilities.',
  }

  appliancesStore.set(readyAppliance.id, readyAppliance)
  appliancesStore.set(processingAppliance.id, processingAppliance)
  appliancesStore.set(failedAppliance.id, failedAppliance)
  scheduleProcessing(processingAppliance)
}

function serializeRecipeSummary(record: RecipeRecord) {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    cuisine: record.cuisine,
    difficulty: record.difficulty,
    totalMinutes: record.totalMinutes,
    servings: record.servings,
    tags: record.tags,
    thumbnailUrl: record.thumbnailUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function serializeRecipeDetail(record: RecipeRecord) {
  return {
    ...serializeRecipeSummary(record),
    ingredients: record.ingredients,
    instructions: record.instructions,
    equipment: record.equipment,
  }
}

function ensureSeedRecipes() {
  if (recipesStore.size > 0) {
    return
  }

  const now = new Date().toISOString()
  const baseRecipes: RecipeRecord[] = [
    {
      id: 'recipe-precision-bread',
      title: 'Precision Steam-Rise Focaccia',
      summary: 'High hydration dough with steam-assisted bake for golden crust and airy crumb.',
      cuisine: 'Italian',
      difficulty: 'moderate',
      totalMinutes: 140,
      servings: 6,
      tags: ['bread', 'steam', 'vegetarian'],
      thumbnailUrl:
        'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
      createdAt: now,
      updatedAt: now,
      ingredients: [
        '500g bread flour',
        '410g water, room temperature',
        '15g fine sea salt',
        '6g instant yeast',
        '45g extra-virgin olive oil, divided',
        'Flaky salt for finishing',
        'Rosemary sprigs',
      ],
      instructions: [
        'Combine flour, yeast, and water. Mix until shaggy and rest 15 minutes.',
        'Fold in salt and 25g olive oil. Stretch and fold every 30 minutes for 2 hours.',
        'Coat pan with remaining oil, transfer dough, and proof until doubled.',
        'Use oiled fingers to dimple dough, top with rosemary, flaky salt.',
        'Bake at 218°C with full steam for 20 minutes, finish dry heat 5 minutes.',
        'Cool on rack 15 minutes before slicing.',
      ],
      equipment: ['Anova Precision Oven', 'Quarter sheet pan', 'Digital scale', 'Mixing bowl'],
    },
    {
      id: 'recipe-induction-risotto',
      title: 'Sensor-Calibrated Saffron Risotto',
      summary: 'Stovetop risotto with precise induction control for silky grains and vibrant saffron.',
      cuisine: 'Italian',
      difficulty: 'advanced',
      totalMinutes: 45,
      servings: 4,
      tags: ['rice', 'stovetop', 'gluten-free'],
      thumbnailUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      createdAt: now,
      updatedAt: now,
      ingredients: [
        '1.2L low-sodium chicken stock',
        '2 pinches saffron threads',
        '40g unsalted butter, divided',
        '1 small shallot, minced',
        '320g carnaroli rice',
        '120ml dry white wine',
        '60g grated Parmigiano-Reggiano',
        'Sea salt and white pepper',
      ],
      instructions: [
        'Warm stock to 82°C on the induction hob, infuse saffron for 5 minutes.',
        'Set induction to 135°C. Sweat shallot in 20g butter until translucent.',
        'Toast rice 2 minutes, stir constantly. Deglaze with wine and reduce by half.',
        'Add ladle of stock, stirring until absorbed. Repeat for 16-18 minutes.',
        'Finish with remaining butter and cheese off-heat. Season to taste.',
      ],
      equipment: ['Breville Control Freak', 'Saucepan', 'Wooden spoon', 'Fine mesh strainer'],
    },
    {
      id: 'recipe-grill-vegetables',
      title: 'Char-Profiled Vegetable Symphony',
      summary: 'Grilled seasonal vegetables with AI-optimized char and marinade retention.',
      cuisine: 'Mediterranean',
      difficulty: 'easy',
      totalMinutes: 30,
      servings: 4,
      tags: ['grill', 'vegan', 'side'],
      thumbnailUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80&sat=-20',
      createdAt: now,
      updatedAt: now,
      ingredients: [
        '1 red bell pepper, cut into panels',
        '1 zucchini, sliced lengthwise',
        '1 red onion, wedges',
        '150g oyster mushrooms',
        '60ml smoked olive oil',
        '15ml red wine vinegar',
        '2 cloves garlic, grated',
        '1 tbsp fresh thyme leaves',
        'Flaky salt and pepper',
      ],
      instructions: [
        'Combine olive oil, vinegar, garlic, thyme, salt, and pepper. Toss vegetables to coat.',
        'Preheat grill insert to 260°C. Arrange vegetables in single layer.',
        'Grill peppers and onions 6 minutes, turning once for crosshatch marks.',
        'Grill zucchini and mushrooms 4 minutes until edges char and centers soften.',
        'Rest vegetables 3 minutes. Finish with marinade drizzled over platter.',
      ],
      equipment: ['Smart grill insert', 'Stainless tongs', 'Mixing bowl'],
    },
  ]

  baseRecipes.forEach((recipe) => {
    recipesStore.set(recipe.id, recipe)
  })
}

function ensureSeedFlowcharts() {
  ensureSeedRecipes()
  ensureSeedAppliances()

  if (recipeFlowchartStore.size > 0) {
    return
  }

  const now = new Date().toISOString()

  recipeFlowchartStore.set('recipe-precision-bread', {
    recipeId: 'recipe-precision-bread',
    mermaid: [
      'graph TD',
      '  start([Activate yeast]) --> mix[Mix & Fold]',
      '  mix --> proof[Bulk proof with folds]',
      '  proof --> pan[Oil pan & shape dough]',
      '  pan --> steamBake[Steam bake 20 min]',
      '  steamBake --> finish[Dry heat finish 5 min]',
      '  finish --> rest[Rest & Slice]',
    ].join('\n'),
    summary: 'Visualizes mixing, proofing, and staged steam baking for the focaccia.',
    updatedAt: now,
    recommendedAppliances: ['Anova Precision Oven'],
  })

  recipeFlowchartStore.set('recipe-induction-risotto', {
    recipeId: 'recipe-induction-risotto',
    mermaid: [
      'graph TD',
      '  prep([Warm stock & infuse saffron]) --> saute[Saute shallot + rice]',
      '  saute --> deglaze[Deglaze with wine]',
      '  deglaze --> ladder[Ladle stock & stir loop]',
      '  ladder --> finish[Finish with butter & cheese]',
      '  finish --> serve[Serve immediately]',
    ].join('\n'),
    summary: 'Captures stock management, induction heat control, and finishing emulsion timing.',
    updatedAt: now,
    recommendedAppliances: ['Breville Control Freak'],
  })

  recipeFlowchartStore.set('recipe-grill-vegetables', {
    recipeId: 'recipe-grill-vegetables',
    mermaid: [
      'graph TD',
      '  marinate([Marinate vegetables]) --> preheat[Preheat grill insert]',
      '  preheat --> batch1[Grill peppers & onions]',
      '  batch1 --> batch2[Grill zucchini & mushrooms]',
      '  batch2 --> rest[Rest & finish with marinade]',
      '  rest --> plate[Plate & serve]',
    ].join('\n'),
    summary: 'Shows marinade staging, grill batches, and finishing drizzle for charred vegetables.',
    updatedAt: now,
    recommendedAppliances: ['Smart grill insert'],
  })
}

function formatApplianceLabel(applianceId: string) {
  ensureSeedAppliances()
  const record = appliancesStore.get(applianceId)
  if (!record) {
    return applianceId
  }

  if (record.nickname) {
    return record.nickname
  }

  return `${record.brand} ${record.model}`
}

function getTailorHistoryKey(recipeId: string, appliances: string[]) {
  const normalized = Array.from(new Set(appliances)).sort((a, b) => a.localeCompare(b))
  return `${recipeId}::${normalized.join('|') || 'none'}`
}

function persistTailorHistory(run: TailoredRecipeRunRecord) {
  const key = getTailorHistoryKey(run.recipeId, run.applianceIds)
  const history = tailorHistoryStore.get(key) ?? []
  const snapshot: TailoredRecipeRunRecord = {
    ...run,
    blocks: run.blocks.map((block) => ({ ...block })),
    recommendedAppliances: [...run.recommendedAppliances],
    applianceIds: [...run.applianceIds],
  }

  history.push(snapshot)
  if (history.length > 5) {
    history.shift()
  }

  tailorHistoryStore.set(key, history)
}

function buildTailorSummary(recipe: RecipeRecord, appliances: string[], blockCount: number) {
  const labels = appliances.map((appliance) => formatApplianceLabel(appliance))
  if (labels.length === 0) {
    return `Personalized guidance generated for ${recipe.title}.`
  }

  if (labels.length === 1) {
    return `${recipe.title} tuned for ${labels[0]} with ${blockCount} guided segments.`
  }

  const last = labels.pop()
  const prefix = labels.join(', ')
  return `${recipe.title} coordinated across ${prefix} and ${last} with ${blockCount} guided segments.`
}

function createTailoredBlocks(
  recipe: RecipeRecord,
  appliances: string[],
): TailoredInstructionBlockRecord[] {
  const primary = formatApplianceLabel(appliances[0] ?? 'appliance-001')
  const secondary = appliances[1] ? formatApplianceLabel(appliances[1]) : null

  if (recipe.id === 'recipe-precision-bread') {
    return [
      {
        id: `${recipe.id}-block-1`,
        title: 'Steam oven prep',
        content: `Preheat ${primary} on steam mode to 218°C. Use 100% steam for the first stage.`,
        applianceContext: primary,
        order: 1,
        durationMinutes: 15,
      },
      {
        id: `${recipe.id}-block-2`,
        title: 'Bulk proof reminders',
        content: 'Schedule coil folds every 30 minutes and oil the pan 10 minutes before shaping.',
        applianceContext: secondary ?? primary,
        order: 2,
        durationMinutes: 60,
      },
      {
        id: `${recipe.id}-block-3`,
        title: 'Steam & finish cycle',
        content: 'Bake 20 minutes on full steam, then vent and switch to dry heat for 5 minutes to crisp.',
        applianceContext: primary,
        order: 3,
        durationMinutes: 25,
      },
    ]
  }

  if (recipe.id === 'recipe-induction-risotto') {
    return [
      {
        id: `${recipe.id}-block-1`,
        title: 'Stock station',
        content: `Hold saffron-infused stock at 82°C on ${secondary ?? 'a secondary burner'} for quick ladling.`,
        applianceContext: secondary ?? primary,
        order: 1,
        durationMinutes: 10,
      },
      {
        id: `${recipe.id}-block-2`,
        title: 'Induction stir cadence',
        content: `Set ${primary} to 135°C sauté mode. Stir continuously with 45-second resting intervals.`,
        applianceContext: primary,
        order: 2,
        durationMinutes: 18,
      },
      {
        id: `${recipe.id}-block-3`,
        title: 'Finish & rest',
        content: 'Lower heat to 93°C, fold in butter and cheese, then rest uncovered for 2 minutes.',
        applianceContext: primary,
        order: 3,
        durationMinutes: 5,
      },
    ]
  }

  if (recipe.id === 'recipe-grill-vegetables') {
    return [
      {
        id: `${recipe.id}-block-1`,
        title: 'High-heat preheat',
        content: `Bring ${primary} to 260°C. Keep grill lid closed to stabilize radiant heat.`,
        applianceContext: primary,
        order: 1,
        durationMinutes: 8,
      },
      {
        id: `${recipe.id}-block-2`,
        title: 'Batch control',
        content: 'Start peppers and onions first, then lower zone temperature 15°C for zucchini and mushrooms.',
        applianceContext: primary,
        order: 2,
        durationMinutes: 12,
      },
      {
        id: `${recipe.id}-block-3`,
        title: 'Finish & baste',
        content: 'Rest vegetables on a warming rack and baste with reserved marinade before plating.',
        applianceContext: secondary ?? primary,
        order: 3,
        durationMinutes: 5,
      },
    ]
  }

  return recipe.instructions.map((instruction, index) => ({
    id: `${recipe.id}-block-${index + 1}`,
    title: `Step ${index + 1}`,
    content: instruction,
    applianceContext: primary,
    order: index + 1,
  }))
}

function listRecipes({
  search,
  difficulty,
  tag,
}: {
  search?: string | null
  difficulty?: RecipeDifficulty | null
  tag?: string | null
}) {
  ensureSeedRecipes()

  let recipes = Array.from(recipesStore.values())

  if (search) {
    const query = search.toLowerCase()
    recipes = recipes.filter((recipe) =>
      [recipe.title, recipe.summary, recipe.cuisine, ...recipe.tags]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }

  if (difficulty) {
    recipes = recipes.filter((recipe) => recipe.difficulty === difficulty)
  }

  if (tag) {
    const normalized = tag.trim().toLowerCase()
    recipes = recipes.filter((recipe) => recipe.tags.some((item) => item.toLowerCase() === normalized))
  }

  recipes.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return recipes.map(serializeRecipeSummary)
}

function parseStringArray(value: unknown, { field, minLength }: { field: string; minLength?: number }) {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`)
  }

  const trimmed = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)

  if (minLength && trimmed.length < minLength) {
    throw new Error(`${field} must include at least ${minLength} item${minLength === 1 ? '' : 's'}`)
  }

  return trimmed
}

function parseRecipePayload(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid JSON payload provided')
  }

  const payload = body as Record<string, unknown>
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : ''
  const cuisine = typeof payload.cuisine === 'string' ? payload.cuisine.trim() : ''
  const difficulty = payload.difficulty
  const totalMinutes = Number(payload.totalMinutes)
  const servings = Number(payload.servings)
  const thumbnailUrl = typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl.trim() : ''
  const tagsValue = payload.tags
  const ingredientsValue = payload.ingredients
  const instructionsValue = payload.instructions
  const equipmentValue = payload.equipment

  if (!title || title.length < 3) {
    throw new Error('Title must be at least 3 characters long')
  }

  if (!summary || summary.length < 10) {
    throw new Error('Summary must be at least 10 characters long')
  }

  if (!cuisine) {
    throw new Error('Cuisine is required')
  }

  const allowedDifficulties: RecipeDifficulty[] = ['easy', 'moderate', 'advanced']
  if (typeof difficulty !== 'string' || !allowedDifficulties.includes(difficulty as RecipeDifficulty)) {
    throw new Error('Difficulty must be easy, moderate, or advanced')
  }

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    throw new Error('Total minutes must be a positive number')
  }

  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error('Servings must be a positive number')
  }

  if (!thumbnailUrl || !/^https?:\/\//.test(thumbnailUrl)) {
    throw new Error('Thumbnail URL must be a valid absolute URL')
  }

  const tags = tagsValue
    ? parseStringArray(tagsValue, { field: 'tags' }).map((tag) => tag.toLowerCase())
    : ([] as string[])

  const ingredients = parseStringArray(ingredientsValue, { field: 'ingredients', minLength: 1 })
  const instructions = parseStringArray(instructionsValue, { field: 'instructions', minLength: 1 })
  const equipment = parseStringArray(equipmentValue, { field: 'equipment', minLength: 1 })

  return {
    title,
    summary,
    cuisine,
    difficulty: difficulty as RecipeDifficulty,
    totalMinutes: Math.round(totalMinutes),
    servings: Math.round(servings),
    tags,
    thumbnailUrl,
    ingredients,
    instructions,
    equipment,
  }
}

async function handleListRecipes(request: Request) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  const url = new URL(request.url)
  const search = url.searchParams.get('search')
  const difficultyParam = url.searchParams.get('difficulty')
  const tag = url.searchParams.get('tag')

  let difficulty: RecipeDifficulty | null = null
  if (difficultyParam && ['easy', 'moderate', 'advanced'].includes(difficultyParam)) {
    difficulty = difficultyParam as RecipeDifficulty
  }

  const recipes = listRecipes({ search, difficulty, tag })
  return jsonResponse({ recipes })
}

async function handleGetRecipe(request: Request, recipeId: string) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedRecipes()
  const record = recipesStore.get(recipeId)

  if (!record) {
    return errorResponse(404, 'Recipe not found')
  }

  return jsonResponse({ recipe: serializeRecipeDetail(record) })
}

async function handleGetRecipeFlowchart(request: Request, recipeId: string) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedFlowcharts()
  const record = recipeFlowchartStore.get(recipeId)

  if (!record) {
    return errorResponse(404, 'Flowchart not found')
  }

  return jsonResponse({ flowchart: record })
}

async function handleTailorRecipe(request: Request, recipeId: string) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedRecipes()
  ensureSeedAppliances()

  const recipe = recipesStore.get(recipeId)

  if (!recipe) {
    return errorResponse(404, 'Recipe not found')
  }

  const body = (await parseJsonBody<unknown>(request)) ?? {}
  const payload = body as { appliances?: unknown; applianceIds?: unknown }
  const candidate = Array.isArray(payload.appliances)
    ? payload.appliances
    : Array.isArray(payload.applianceIds)
      ? payload.applianceIds
      : []
  const appliances = Array.isArray(candidate)
    ? candidate.filter((value): value is string => typeof value === 'string')
    : []
  const normalized = Array.from(new Set(appliances))
  const applianceIds = normalized.length > 0 ? normalized : ['appliance-001']

  const blocks = createTailoredBlocks(recipe, applianceIds)
  const run: TailoredRecipeRunRecord = {
    runId: `tailor-${crypto.randomUUID()}`,
    recipeId,
    applianceIds,
    startedAt: new Date().toISOString(),
    status: 'streaming',
    summary: buildTailorSummary(recipe, applianceIds, blocks.length),
    recommendedAppliances: applianceIds.map((appliance) => formatApplianceLabel(appliance)),
    blocks: [],
  }

  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`))
        }

        send('meta', {
          summary: run.summary,
          recommendedAppliances: run.recommendedAppliances,
        })
        send('status', { message: 'Calibrating appliance offsets…' })

        if (applianceIds.includes('appliance-003')) {
          setTimeout(() => {
            run.status = 'error'
            run.completedAt = new Date().toISOString()
            run.errorMessage = 'Lab test unit is offline. Retry once it reconnects.'
            send('error', { message: run.errorMessage, retryable: true })
            persistTailorHistory(run)
            controller.close()
          }, 700)
          return
        }

        if (blocks.length === 0) {
          run.status = 'complete'
          run.completedAt = new Date().toISOString()
          send('complete', { message: 'Tailoring complete' })
          persistTailorHistory(run)
          controller.close()
          return
        }

        blocks.forEach((block, index) => {
          const delay = 650 * (index + 1)
          setTimeout(() => {
            run.blocks.push(block)
            send('block', block)
            send('status', { message: `Customizing step ${index + 1} of ${blocks.length}…` })

            if (index === blocks.length - 1) {
              run.status = 'complete'
              run.completedAt = new Date().toISOString()
              send('complete', { message: 'Tailoring complete' })
              persistTailorHistory(run)
              controller.close()
            }
          }, delay)
        })
      },
      cancel() {
        if (run.status === 'streaming') {
          run.status = 'error'
          run.completedAt = new Date().toISOString()
          run.errorMessage = 'Tailoring cancelled by client.'
          persistTailorHistory(run)
        }
      },
    }),
    {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-store',
      },
    },
  )
}

async function handleGetTailorHistory(request: Request, recipeId: string) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  const url = new URL(request.url)
  const appliancesParam = url.searchParams.get('appliances')
  const appliances = appliancesParam ? appliancesParam.split(',').filter(Boolean) : []
  const key = getTailorHistoryKey(recipeId, appliances)
  const history = tailorHistoryStore.get(key) ?? []
  const latest = history.length > 0 ? history[history.length - 1] : null

  return jsonResponse({ history: latest })
}

async function handleCreateRecipe(request: Request) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed')
  }

  const body = await parseJsonBody<unknown>(request)

  if (!body) {
    return errorResponse(400, 'Invalid JSON payload provided')
  }

  try {
    const parsed = parseRecipePayload(body)
    const now = new Date().toISOString()
    const id = `recipe-${crypto.randomUUID()}`
    const record: RecipeRecord = {
      id,
      ...parsed,
      createdAt: now,
      updatedAt: now,
    }

    recipesStore.set(id, record)

    return jsonResponse({ recipe: serializeRecipeDetail(record) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create recipe', error)
    return errorResponse(400, error instanceof Error ? error.message : 'Unable to create recipe')
  }
}

async function handleUpdateRecipe(request: Request, recipeId: string) {
  if (request.method !== 'PUT') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedRecipes()
  const existing = recipesStore.get(recipeId)

  if (!existing) {
    return errorResponse(404, 'Recipe not found')
  }

  const body = await parseJsonBody<unknown>(request)

  if (!body) {
    return errorResponse(400, 'Invalid JSON payload provided')
  }

  try {
    const parsed = parseRecipePayload(body)
    const updated: RecipeRecord = {
      ...existing,
      ...parsed,
      updatedAt: new Date().toISOString(),
    }

    recipesStore.set(recipeId, updated)

    return jsonResponse({ recipe: serializeRecipeDetail(updated) })
  } catch (error) {
    console.error('Failed to update recipe', error)
    return errorResponse(400, error instanceof Error ? error.message : 'Unable to update recipe')
  }
}

async function handleDeleteRecipe(request: Request, recipeId: string) {
  if (request.method !== 'DELETE') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedRecipes()

  const deleted = recipesStore.delete(recipeId)

  if (!deleted) {
    return errorResponse(404, 'Recipe not found')
  }

  return jsonResponse({ ok: true })
}

function listAppliances() {
  ensureSeedAppliances()

  return Array.from(appliancesStore.values())
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .map(serializeAppliance)
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

async function handleListAppliances(request: Request) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  return jsonResponse({ appliances: listAppliances() })
}

async function handleGetAppliance(request: Request, applianceId: string) {
  if (request.method !== 'GET') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedAppliances()
  const record = appliancesStore.get(applianceId)
  if (!record) {
    return errorResponse(404, 'Appliance not found')
  }

  return jsonResponse({ appliance: serializeAppliance(record) })
}

async function handleCreateAppliance(request: Request) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed')
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return errorResponse(400, 'Request must be multipart/form-data')
  }

  const formData = await request.formData()
  const brand = String(formData.get('brand') ?? '').trim()
  const model = String(formData.get('model') ?? '').trim()
  const nicknameValue = formData.get('nickname')
  const nickname = typeof nicknameValue === 'string' ? nicknameValue.trim() : ''
  const manualFile = formData.get('manual')

  if (!brand) {
    return errorResponse(400, 'Brand is required')
  }

  if (!model) {
    return errorResponse(400, 'Model is required')
  }

  if (!(manualFile instanceof File)) {
    return errorResponse(400, 'Manual upload is required')
  }

  if (manualFile.type !== 'application/pdf') {
    return errorResponse(400, 'Manual must be provided as a PDF document')
  }

  const MAX_BYTES = 25 * 1024 * 1024
  if (manualFile.size > MAX_BYTES) {
    return errorResponse(413, 'Manual exceeds the 25MB limit for uploads')
  }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const manualFileName = manualFile.name || `${brand}-${model}.pdf`.replace(/\s+/g, '-').toLowerCase()
  const shouldFail = manualFileName.toLowerCase().includes('fail')
  const failureReason = shouldFail
    ? 'Manual upload could not be parsed. Retry after confirming the PDF is readable.'
    : null

  const record: ApplianceRecord = {
    id,
    brand,
    model,
    nickname: nickname || undefined,
    status: 'queued',
    uploadedAt: now,
    updatedAt: now,
    manualFileName,
    manualUrl: null,
    processingProgress: 0,
    statusDetail: null,
    processingOutcome: shouldFail ? 'error' : 'success',
    failureReason,
  }

  appliancesStore.set(id, record)
  scheduleProcessing(record)

  return jsonResponse({ appliance: serializeAppliance(record) }, { status: 201 })
}

async function handleDeleteAppliance(request: Request, applianceId: string) {
  if (request.method !== 'DELETE') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedAppliances()
  const existed = appliancesStore.delete(applianceId)
  clearProcessingTimers(applianceId)

  if (!existed) {
    return errorResponse(404, 'Appliance not found')
  }

  return jsonResponse({ ok: true }, { status: 200 })
}

async function handleRetryAppliance(request: Request, applianceId: string) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed')
  }

  ensureSeedAppliances()
  const record = appliancesStore.get(applianceId)

  if (!record) {
    return errorResponse(404, 'Appliance not found')
  }

  const body = (await parseJsonBody<{ outcome?: 'success' | 'error'; reason?: string }>(request)) ?? {}
  const outcome = body.outcome === 'error' ? 'error' : 'success'

  record.processingOutcome = outcome
  record.failureReason =
    outcome === 'error'
      ? body.reason ?? 'Manual processing failed during retry. Please try again shortly.'
      : null
  record.statusDetail = null
  record.manualUrl = null
  record.processingProgress = 0
  record.updatedAt = new Date().toISOString()

  scheduleProcessing(record)

  return jsonResponse({ appliance: serializeAppliance(record) }, { status: 202 })
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

    if (url.pathname === `${API_PREFIX}/kitchen/appliances`) {
      if (request.method === 'GET') {
        return handleListAppliances(request)
      }

      if (request.method === 'POST') {
        return handleCreateAppliance(request)
      }

      return errorResponse(405, 'Method Not Allowed')
    }

    if (url.pathname.startsWith(`${API_PREFIX}/kitchen/appliances/`)) {
      const segments = url.pathname.slice(`${API_PREFIX}/kitchen/appliances`.length).split('/').filter(Boolean)
      const applianceId = segments[0]

      if (!applianceId) {
        return errorResponse(404, 'Appliance not found')
      }

      if (segments.length > 1) {
        const action = segments[1]

        if (action === 'retry') {
          return handleRetryAppliance(request, applianceId)
        }

        return errorResponse(404, 'Endpoint not implemented in mock worker')
      }

      if (request.method === 'GET') {
        return handleGetAppliance(request, applianceId)
      }

      if (request.method === 'DELETE') {
        return handleDeleteAppliance(request, applianceId)
      }

      return errorResponse(405, 'Method Not Allowed')
    }

    if (url.pathname === `${API_PREFIX}/recipes`) {
      if (request.method === 'GET') {
        return handleListRecipes(request)
      }

      if (request.method === 'POST') {
        return handleCreateRecipe(request)
      }

      return errorResponse(405, 'Method Not Allowed')
    }

    if (url.pathname.startsWith(`${API_PREFIX}/recipes/`)) {
      const segments = url.pathname.slice(`${API_PREFIX}/recipes/`.length).split('/').filter(Boolean)
      const recipeId = segments[0]

      if (!recipeId) {
        return errorResponse(404, 'Recipe not found')
      }

      const action = segments[1]

      if (action === 'flowchart') {
        return handleGetRecipeFlowchart(request, recipeId)
      }

      if (action === 'tailor') {
        const subAction = segments[2]
        if (subAction === 'history') {
          return handleGetTailorHistory(request, recipeId)
        }

        return handleTailorRecipe(request, recipeId)
      }

      if (segments.length > 1) {
        return errorResponse(404, 'Endpoint not implemented in mock worker')
      }

      if (request.method === 'GET') {
        return handleGetRecipe(request, recipeId)
      }

      if (request.method === 'PUT') {
        return handleUpdateRecipe(request, recipeId)
      }

      if (request.method === 'DELETE') {
        return handleDeleteRecipe(request, recipeId)
      }

      return errorResponse(405, 'Method Not Allowed')
    }

    if (url.pathname.startsWith(API_PREFIX)) {
      return errorResponse(404, 'Endpoint not implemented in mock worker')
    }

    return env.ASSETS.fetch(request)
  },
}
