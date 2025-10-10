import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { ApiError, useApi } from '@/lib/api'
import { streamApi } from '@/lib/streaming'
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from '@/lib/toast'

export type RecipeDifficulty = 'easy' | 'moderate' | 'advanced'

export interface RecipeSummary {
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
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: string[]
  instructions: string[]
  equipment: string[]
}

export interface RecipeFlowchart {
  recipeId: string
  mermaid: string
  summary: string
  updatedAt: string
  recommendedAppliances: string[]
}

export type TailoredRunStatus = 'idle' | 'streaming' | 'complete' | 'error' | 'cancelled'

export interface TailoredInstructionBlock {
  id: string
  title: string
  content: string
  applianceContext: string
  order: number
  durationMinutes?: number
}

export interface TailoredRecipeRun {
  runId: string
  recipeId: string
  applianceIds: string[]
  startedAt: string
  completedAt?: string
  status: TailoredRunStatus
  summary?: string | null
  recommendedAppliances?: string[]
  blocks: TailoredInstructionBlock[]
  errorMessage?: string | null
}

export interface RecipeFilters {
  search?: string
  difficulty?: RecipeDifficulty
  tag?: string
}

const recipesListBaseKey = ['recipes', 'list'] as const

export const recipeListKey = (filters: RecipeFilters = {}) => [...recipesListBaseKey, filters] as const

export const recipeDetailKey = (recipeId: string) => ['recipes', 'detail', recipeId] as const

export const recipeFlowchartKey = (recipeId: string) => ['recipes', 'flowchart', recipeId] as const

const normalizeApplianceIds = (applianceIds: string[]) =>
  [...new Set(applianceIds)].sort((a, b) => a.localeCompare(b))

export const tailoredRecipeKey = (recipeId: string, applianceIds: string[]) => {
  const normalized = normalizeApplianceIds(applianceIds)
  const cacheKey = normalized.length > 0 ? normalized.join('|') : 'none'
  return ['recipes', 'tailored', recipeId, cacheKey] as const
}

type RecipeListResult = UseQueryResult<RecipeSummary[]>

type RecipeDetailResult = UseQueryResult<RecipeDetail, Error>

function updateAllRecipeLists(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (recipes: RecipeSummary[] | undefined) => RecipeSummary[] | undefined,
) {
  const queries = queryClient.getQueriesData<RecipeSummary[]>({ queryKey: recipesListBaseKey })

  queries.forEach(([key, value]) => {
    const next = updater(value)
    if (next) {
      queryClient.setQueryData(key, next)
    }
  })
}

export function useRecipes(filters: RecipeFilters = {}): RecipeListResult {
  const api = useApi()

  return useQuery<RecipeSummary[]>({
    queryKey: recipeListKey(filters),
    queryFn: async () => {
      const response = await api.get<{ recipes: RecipeSummary[] }>('/api/recipes', {
        query: {
          search: filters.search?.trim() || undefined,
          difficulty: filters.difficulty,
          tag: filters.tag?.trim() || undefined,
        },
      })

      return response.recipes
    },
    placeholderData: (previous) => previous,
  })
}

export function useRecipeDetail(recipeId: string | undefined): RecipeDetailResult {
  const api = useApi()

  return useQuery<RecipeDetail, Error>({
    queryKey: recipeDetailKey(recipeId ?? 'unknown'),
    queryFn: async () => {
      if (!recipeId) {
        throw new Error('Recipe identifier is required')
      }

      const response = await api.get<{ recipe: RecipeDetail }>(`/api/recipes/${recipeId}`)
      return response.recipe
    },
    enabled: Boolean(recipeId),
    retry: (failureCount, error) => {
      if ((error as Error).message.includes('not found')) {
        return false
      }

      return failureCount < 2
    },
  })
}

export interface RecipeFlowchartResult extends RecipeFlowchart {}

export function useRecipeFlowchart(recipeId: string | undefined) {
  const api = useApi()

  return useQuery<RecipeFlowchart, Error>({
    queryKey: recipeFlowchartKey(recipeId ?? 'unknown'),
    queryFn: async () => {
      if (!recipeId) {
        throw new Error('Recipe identifier is required')
      }

      const response = await api.get<{ flowchart: RecipeFlowchart }>(`/api/recipes/${recipeId}/flowchart`)
      return response.flowchart
    },
    enabled: Boolean(recipeId),
    placeholderData: (previous) => previous,
    gcTime: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 5,
  })
}

interface TailoredRecipeOptions {
  recipeId: string | undefined
  applianceIds: string[]
}

interface TailoredRecipeHookResult {
  data: TailoredRecipeRun | null
  isStreaming: boolean
  statusMessage: string | null
  startTailoring: () => void
  cancel: () => void
  isPending: boolean
}

export function useTailoredRecipe({ recipeId, applianceIds }: TailoredRecipeOptions): TailoredRecipeHookResult {
  const api = useApi()
  const queryClient = useQueryClient()
  const normalizedIds = useMemo(() => normalizeApplianceIds(applianceIds), [applianceIds])
  const queryKey = useMemo(
    () => tailoredRecipeKey(recipeId ?? 'unknown', normalizedIds),
    [recipeId, normalizedIds],
  )
  const abortRef = useRef<AbortController | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const query = useQuery<TailoredRecipeRun | null, Error>({
    queryKey,
    queryFn: async () => {
      if (!recipeId) {
        throw new Error('Recipe identifier is required')
      }

      try {
        const response = await api.get<{ history: TailoredRecipeRun | null }>(
          `/api/recipes/${recipeId}/tailor/history`,
          {
            query: normalizedIds.length > 0 ? { appliances: normalizedIds.join(',') } : undefined,
          },
        )
        return response.history
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null
        }

        throw error
      }
    },
    enabled: false,
    placeholderData: (previous) => previous ?? null,
    gcTime: 1000 * 60 * 30,
  })

  useEffect(() => {
    setStatusMessage(null)
  }, [queryKey])

  const updateRun = (updater: (run: TailoredRecipeRun) => TailoredRecipeRun) => {
    queryClient.setQueryData<TailoredRecipeRun | null>(queryKey, (current) => {
      if (!current) {
        return current
      }

      return updater(current)
    })
  }

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!recipeId) {
        throw new Error('Recipe identifier is required')
      }

      const controller = new AbortController()
      abortRef.current = controller

      const run: TailoredRecipeRun = {
        runId: `tailor-${crypto.randomUUID()}`,
        recipeId,
        applianceIds: normalizedIds,
        startedAt: new Date().toISOString(),
        status: 'streaming',
        summary: null,
        recommendedAppliances: [],
        blocks: [],
        errorMessage: null,
      }

      queryClient.setQueryData(queryKey, run)
      setIsStreaming(true)
      setStatusMessage('Tailoring instructions for your kitchen...')
      showInfoToast('Tailoring instructions for your kitchen...', {
        id: `info-tailor-${recipeId}`,
      })

      let streamError: Error | null = null

      await streamApi(
        `/api/recipes/${recipeId}/tailor`,
        {
          onEvent: ({ event, data }) => {
            if (event === 'status') {
              try {
                const payload = JSON.parse(data) as { message?: string }
                if (payload.message) {
                  setStatusMessage(payload.message)
                }
              } catch {
                setStatusMessage(data)
              }
              return
            }

            if (event === 'meta') {
              try {
                const payload = JSON.parse(data) as {
                  summary?: string
                  recommendedAppliances?: string[]
                }
                updateRun((current) => ({
                  ...current,
                  summary: payload.summary ?? current.summary,
                  recommendedAppliances: payload.recommendedAppliances ?? current.recommendedAppliances,
                }))
              } catch {
                // ignore malformed payloads
              }
              return
            }

            if (event === 'block') {
              try {
                const payload = JSON.parse(data) as TailoredInstructionBlock
                updateRun((current) => {
                  const nextBlocks = current.blocks.some((block) => block.id === payload.id)
                    ? current.blocks
                    : [...current.blocks, payload].sort((a, b) => a.order - b.order)
                  return { ...current, blocks: nextBlocks }
                })
              } catch {
                // ignore malformed payloads
              }
              return
            }

            if (event === 'error') {
              try {
                const payload = JSON.parse(data) as { message?: string; retryable?: boolean }
                const message = payload.message ?? 'Tailoring failed'
                streamError = new Error(message)
                updateRun((current) => ({
                  ...current,
                  status: 'error',
                  completedAt: new Date().toISOString(),
                  errorMessage: message,
                }))
                setStatusMessage(message)
                const toastId = payload.retryable ? `warning-tailor-${recipeId}` : `error-tailor-${recipeId}`
                const showToast = payload.retryable ? showWarningToast : showErrorToast
                showToast(message, { id: toastId })
              } catch {
                const message = data || 'Tailoring failed'
                streamError = new Error(message)
                updateRun((current) => ({
                  ...current,
                  status: 'error',
                  completedAt: new Date().toISOString(),
                  errorMessage: message,
                }))
                setStatusMessage(message)
                showErrorToast(message, { id: `error-tailor-${recipeId}` })
              }
              setIsStreaming(false)
              return
            }

            if (event === 'complete') {
              const completedAt = new Date().toISOString()
              updateRun((current) => ({
                ...current,
                status: 'complete',
                completedAt,
                errorMessage: null,
              }))
              setStatusMessage('Tailored instructions ready')
              setIsStreaming(false)
              showSuccessToast('Tailored instructions ready', {
                id: `success-tailor-${recipeId}`,
              })
              return
            }
          },
          onClose: () => {
            abortRef.current = null
          },
        },
        {
          method: 'POST',
          body: { appliances: normalizedIds },
          signal: controller.signal,
        },
      )

      if (streamError) {
        throw streamError
      }
    },
    onError: (error) => {
      if (error.name === 'AbortError') {
        return
      }

      setIsStreaming(false)
      setStatusMessage(error.message)
      updateRun((current) => ({
        ...current,
        status: 'error',
        completedAt: current.completedAt ?? new Date().toISOString(),
        errorMessage: error.message,
      }))
      showErrorToast(error.message, { id: `error-tailor-${recipeId}` })
    },
    onSettled: () => {
      abortRef.current = null
    },
  })

  const cancel = () => {
    const controller = abortRef.current
    if (controller) {
      controller.abort()
      setIsStreaming(false)
      setStatusMessage('Tailoring cancelled')
      updateRun((current) => ({
        ...current,
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      }))
      showInfoToast('Tailoring cancelled', { id: `info-tailor-cancel-${recipeId}` })
    }
  }

  return {
    data: query.data ?? null,
    isStreaming,
    statusMessage,
    startTailoring: () => mutation.mutate(),
    cancel,
    isPending: mutation.isPending,
  }
}

export interface RecipePayload {
  title: string
  summary: string
  cuisine: string
  difficulty: RecipeDifficulty
  totalMinutes: number
  servings: number
  tags: string[]
  thumbnailUrl: string
  ingredients: string[]
  instructions: string[]
  equipment: string[]
}

type CreateRecipeMutation = UseMutationResult<RecipeDetail, Error, RecipePayload, { optimisticId?: string }>

type UpdateRecipeMutation = UseMutationResult<
  RecipeDetail,
  Error,
  { id: string; data: RecipePayload },
  { previousDetail?: RecipeDetail }
>

type RecipesQueriesSnapshot = Array<[QueryKey, RecipeSummary[] | undefined]>

type DeleteRecipeMutation = UseMutationResult<
  { ok: true },
  Error,
  { id: string },
  { previousLists: RecipesQueriesSnapshot; previousDetail?: RecipeDetail }
>

export function useCreateRecipeMutation(): CreateRecipeMutation {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation<RecipeDetail, Error, RecipePayload, { optimisticId?: string }>({
    mutationFn: async (variables) => {
      const response = await api.post<{ recipe: RecipeDetail }>('/api/recipes', {
        body: variables,
      })

      return response.recipe
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: recipesListBaseKey })

      const optimisticId = `temp-${crypto.randomUUID()}`
      const optimisticRecipe: RecipeDetail = {
        id: optimisticId,
        ...variables,
        tags: variables.tags.map((tag) => tag.toLowerCase()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      updateAllRecipeLists(queryClient, (recipes) => [optimisticRecipe, ...(recipes ?? [])])
      queryClient.setQueryData(recipeDetailKey(optimisticId), optimisticRecipe)

      return { optimisticId }
    },
    onError: (error, _variables, context) => {
      updateAllRecipeLists(queryClient, (recipes) => recipes?.filter((recipe) => recipe.id !== context?.optimisticId))
      showErrorToast(error.message)
    },
    onSuccess: (recipe, _variables, context) => {
      if (context?.optimisticId) {
        updateAllRecipeLists(queryClient, (recipes) =>
          recipes?.map((entry) => (entry.id === context.optimisticId ? recipe : entry)),
        )
        queryClient.removeQueries({ queryKey: recipeDetailKey(context.optimisticId), exact: true })
      }

      updateAllRecipeLists(queryClient, (recipes) => [recipe, ...(recipes ?? []).filter((entry) => entry.id !== recipe.id)])
      queryClient.setQueryData(recipeDetailKey(recipe.id), recipe)

      showSuccessToast('Recipe created successfully')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: recipesListBaseKey })
    },
  })
}

export function useUpdateRecipeMutation(): UpdateRecipeMutation {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation<RecipeDetail, Error, { id: string; data: RecipePayload }, { previousDetail?: RecipeDetail }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<{ recipe: RecipeDetail }>(`/api/recipes/${id}`, {
        body: data,
      })

      return response.recipe
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: recipesListBaseKey })
      await queryClient.cancelQueries({ queryKey: recipeDetailKey(id) })

      const previousDetail = queryClient.getQueryData<RecipeDetail>(recipeDetailKey(id))

      const optimistic: RecipeDetail = {
        id,
        ...data,
        createdAt: previousDetail?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData(recipeDetailKey(id), optimistic)
      updateAllRecipeLists(queryClient, (recipes) =>
        recipes?.map((entry) => (entry.id === id ? { ...entry, ...optimistic } : entry)),
      )

      return { previousDetail }
    },
    onError: (error, _variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(recipeDetailKey(context.previousDetail.id), context.previousDetail)
      }

      showErrorToast(error.message)
    },
    onSuccess: (recipe) => {
      updateAllRecipeLists(queryClient, (recipes) =>
        recipes?.map((entry) => (entry.id === recipe.id ? recipe : entry)),
      )
      queryClient.setQueryData(recipeDetailKey(recipe.id), recipe)

      showSuccessToast('Recipe updated')
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.id) {
        void queryClient.invalidateQueries({ queryKey: recipeDetailKey(variables.id) })
      }
      void queryClient.invalidateQueries({ queryKey: recipesListBaseKey })
    },
  })
}

export function useDeleteRecipeMutation(): DeleteRecipeMutation {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation<{ ok: true }, Error, { id: string }, { previousLists: RecipesQueriesSnapshot; previousDetail?: RecipeDetail }>(
    {
      mutationFn: async ({ id }) => {
        return api.delete<{ ok: true }>(`/api/recipes/${id}`)
      },
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: recipesListBaseKey })

        const previousLists = queryClient.getQueriesData<RecipeSummary[]>({
          queryKey: recipesListBaseKey,
        }) as RecipesQueriesSnapshot
        const previousDetail = queryClient.getQueryData<RecipeDetail>(recipeDetailKey(id))

        updateAllRecipeLists(queryClient, (recipes) => recipes?.filter((entry) => entry.id !== id))
        queryClient.removeQueries({ queryKey: recipeDetailKey(id), exact: true })

        return { previousLists, previousDetail }
      },
      onError: (error, _variables, context) => {
        context?.previousLists?.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })

        if (context?.previousDetail) {
          queryClient.setQueryData(recipeDetailKey(context.previousDetail.id), context.previousDetail)
        }

        showErrorToast(error.message)
      },
      onSuccess: () => {
        showInfoToast('Recipe removed')
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: recipesListBaseKey })
      },
    },
  )
}
