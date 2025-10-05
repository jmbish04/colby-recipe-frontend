import { useEffect, useMemo, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useApi } from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

export type ApplianceStatus = 'processing' | 'ready' | 'error'

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
}

export interface ApplianceListResponse {
  appliances: Appliance[]
}

export interface ApplianceResponse {
  appliance: Appliance
}

const appliancesKey = ['kitchen', 'appliances'] as const

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

      return list.some((appliance) => appliance.status === 'processing') ? 2000 : false
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
        status: 'processing',
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualFileName: variables.manual.name,
        manualUrl: null,
        processingProgress: 12,
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
