import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useApi } from '@/lib/api'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

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

export interface RecipeFilters {
  search?: string
  difficulty?: RecipeDifficulty
  tag?: string
}

const recipesListBaseKey = ['recipes', 'list'] as const

export const recipeListKey = (filters: RecipeFilters = {}) => [...recipesListBaseKey, filters] as const

export const recipeDetailKey = (recipeId: string) => ['recipes', 'detail', recipeId] as const

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
