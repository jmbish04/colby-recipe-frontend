import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useApi } from '@/lib/api'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

export type ApplianceStatus = 'queued' | 'processing' | 'ready' | 'error'

export interface Appliance {
  id: string
  brand: string
  model: string
  nickname?: string | null
  status: ApplianceStatus
  uploadedAt: string
  updatedAt: string
  manualFileName?: string | null
  manualUrl?: string | null
  processingProgress?: number | null
  statusDetail?: string | null
}

export interface ApplianceListResponse {
  appliances: Appliance[]
}

export interface ApplianceResponse {
  appliance: Appliance
}

export const appliancesKey = ['kitchen', 'appliances'] as const

export const applianceDetailKey = (applianceId: string) => [...appliancesKey, applianceId] as const

function useSimulatedProgress(isActive: boolean, isComplete: boolean) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive) {
      if (isComplete) {
        setProgress(100)
        const timeout = setTimeout(() => setProgress(0), 600)
        return () => clearTimeout(timeout)
      }

      setProgress(0)
      return undefined
    }

    setProgress((value) => (value > 0 ? value : 18))

    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return current
        }

        const next = current + Math.random() * 12
        return next > 92 ? 92 : next
      })
    }, 350)

    return () => {
      clearInterval(timer)
    }
  }, [isActive, isComplete])

  return Math.round(progress)
}

export function useAppliancesQuery(): UseQueryResult<Appliance[]> {
  const api = useApi()

  return useQuery<Appliance[]>({
    queryKey: appliancesKey,
    queryFn: async () => {
      const response = await api.get<ApplianceListResponse>('/api/kitchen/appliances')
      return response.appliances
    },
    refetchInterval: (query) => {
      const list = query.state.data as Appliance[] | undefined
      if (!list) {
        return false
      }

      return list.some((appliance) => appliance.status === 'processing' || appliance.status === 'queued') ? 2000 : false
    },
  })
}

interface CreateApplianceInput {
  brand: string
  model: string
  nickname?: string | null
  manual: File
}

type CreateContext = { previous?: Appliance[]; optimisticId: string }
type CreateMutation = UseMutationResult<Appliance, Error, CreateApplianceInput, CreateContext>

export function useCreateApplianceMutation() {
  const api = useApi()
  const queryClient = useQueryClient()
  const mutation = useMutation<Appliance, Error, CreateApplianceInput, CreateContext>({
    mutationFn: async ({ brand, model, nickname, manual }) => {
      const formData = new FormData()
      formData.set('brand', brand)
      formData.set('model', model)
      if (nickname) {
        formData.set('nickname', nickname)
      }
      formData.set('manual', manual)

      const response = await api.post<ApplianceResponse>('/api/kitchen/appliances', {
        body: formData,
      })

      return response.appliance
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: appliancesKey })
      const previous = queryClient.getQueryData<Appliance[]>(appliancesKey)

      const optimisticAppliance: Appliance = {
        id: `temp-${crypto.randomUUID()}`,
        brand: variables.brand,
        model: variables.model,
        nickname: variables.nickname ?? null,
        status: 'queued',
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualFileName: variables.manual.name,
        manualUrl: null,
        processingProgress: 0,
        statusDetail: null,
      }

      queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => [optimisticAppliance, ...(existing ?? [])])

      return { previous, optimisticId: optimisticAppliance.id }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(appliancesKey, context.previous)
      }

      showErrorToast(error.message)
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => {
        if (!existing) {
          return [data]
        }

        if (context?.optimisticId) {
          return existing.map((appliance) => (appliance.id === context.optimisticId ? data : appliance))
        }

        return [data, ...existing]
      })

      showSuccessToast('Appliance uploaded successfully')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: appliancesKey })
    },
  })

  const progress = useSimulatedProgress(mutation.status === 'pending', mutation.status === 'success')

  return useMemo(() => ({ ...mutation, progress }), [mutation, progress]) as CreateMutation & { progress: number }
}

export function useApplianceStatus(appliance: Appliance) {
  const api = useApi()
  const queryClient = useQueryClient()
  const previousStatusRef = useRef<ApplianceStatus>(appliance.status)
  const previousIdRef = useRef(appliance.id)

  useEffect(() => {
    if (appliance.id !== previousIdRef.current) {
      previousIdRef.current = appliance.id
      previousStatusRef.current = appliance.status
    }
  }, [appliance.id, appliance.status])

  const detailQuery = useQuery<Appliance>({
    queryKey: applianceDetailKey(appliance.id),
    queryFn: async () => {
      const response = await api.get<ApplianceResponse>(`/api/kitchen/appliances/${appliance.id}`)
      return response.appliance
    },
    enabled: appliance.status === 'queued' || appliance.status === 'processing',
    refetchInterval: (query) => {
      const current = (query.state.data as Appliance | undefined)?.status ?? appliance.status
      return current === 'queued' || current === 'processing' ? 1600 : false
    },
  })

  const resolvedAppliance = detailQuery.data ?? appliance
  const activeStatus = resolvedAppliance.status

  useEffect(() => {
    const nextAppliance = detailQuery.data
    if (!nextAppliance) {
      return
    }

    queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => {
      if (!existing) {
        return [nextAppliance]
      }

      return existing.map((item) => (item.id === nextAppliance.id ? nextAppliance : item))
    })
  }, [detailQuery.data, queryClient])

  useEffect(() => {
    const previous = previousStatusRef.current
    const next = activeStatus

    if (previous === next) {
      return
    }

    const transitionedFromBackground = previous === 'queued' || previous === 'processing'

    if (transitionedFromBackground && next === 'ready') {
      showSuccessToast('Manual ready')
    }

    if (transitionedFromBackground && next === 'error') {
      showErrorToast('Manual processing failed')
    }

    previousStatusRef.current = next
  }, [activeStatus])

  return {
    appliance: resolvedAppliance,
    isPolling: detailQuery.isFetching || detailQuery.isRefetching,
    query: detailQuery,
  }
}

type RetryContext = { previous?: Appliance[] }

export function useRetryApplianceProcessingMutation() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation<Appliance, Error, string, RetryContext>({
    mutationFn: async (applianceId) => {
      const response = await api.post<ApplianceResponse>(`/api/kitchen/appliances/${applianceId}/retry`, {
        body: {},
      })

      return response.appliance
    },
    onMutate: async (applianceId) => {
      await queryClient.cancelQueries({ queryKey: appliancesKey })
      const previous = queryClient.getQueryData<Appliance[]>(appliancesKey)

      queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => {
        const source = existing ?? previous ?? []

        return source.map((item) =>
          item.id === applianceId
            ? {
                ...item,
                status: 'queued',
                processingProgress: 0,
                statusDetail: null,
                updatedAt: new Date().toISOString(),
              }
            : item,
        )
      })

      return { previous }
    },
    onError: (error, _applianceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(appliancesKey, context.previous)
      }

      showErrorToast(error.message)
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => {
        if (!existing) {
          return [data]
        }

        return existing.map((item) => (item.id === data.id ? data : item))
      })

      showInfoToast('Manual reprocessing queued')
    },
    onSettled: (_data, _error, applianceId) => {
      void queryClient.invalidateQueries({ queryKey: appliancesKey })
      void queryClient.invalidateQueries({ queryKey: applianceDetailKey(applianceId) })
    },
  })
}

type DeleteContext = { previous?: Appliance[] }
type DeleteMutation = UseMutationResult<void, Error, string, DeleteContext>

export function useDeleteApplianceMutation() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation<void, Error, string, DeleteContext>({
    mutationFn: async (applianceId) => {
      await api.delete(`/api/kitchen/appliances/${applianceId}`)
    },
    onMutate: async (applianceId) => {
      await queryClient.cancelQueries({ queryKey: appliancesKey })
      const previous = queryClient.getQueryData<Appliance[]>(appliancesKey)

      queryClient.setQueryData<Appliance[]>(appliancesKey, (existing) => existing?.filter((item) => item.id !== applianceId) ?? [])

      return { previous }
    },
    onError: (error, _applianceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(appliancesKey, context.previous)
      }

      showErrorToast(error.message)
    },
    onSuccess: () => {
      showSuccessToast('Appliance removed')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: appliancesKey })
    },
  }) as DeleteMutation
}
