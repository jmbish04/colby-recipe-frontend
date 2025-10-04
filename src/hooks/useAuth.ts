import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, useApi } from '@/lib/api'
import { useAuthStore, selectIsAuthenticated, type User } from '@/stores/useAuthStore'

const CURRENT_USER_QUERY_KEY = ['current-user'] as const

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  user: User
}

type CurrentUserResponse = {
  user: User
}

export function useCurrentUser() {
  const api = useApi()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)

  const queryResult = useQuery<CurrentUserResponse, ApiError, User>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => api.get<CurrentUserResponse>('/auth/me'),
    select: (data) => data.user,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (queryResult.status === 'success') {
      setUser(queryResult.data)
    }
  }, [queryResult.status, queryResult.data, setUser])

  useEffect(() => {
    const error = queryResult.error
    if (error instanceof ApiError && error.status === 401) {
      logout()
    }
  }, [queryResult.error, logout])

  return queryResult
}

export function useLogin() {
  const api = useApi()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await api.post<LoginResponse>('/auth/login', { body: payload })
      setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
      })
      setUser(response.user)
      return response
    },
    onSuccess: (data) => {
      toast.success(`Signed in as ${data.user.name}`)
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Unable to sign in. Please try again.')
      }
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)

  return useCallback(() => {
    logout()
    queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    toast.success('Signed out successfully')
  }, [logout, queryClient])
}
