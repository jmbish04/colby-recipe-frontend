import { QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError } from '@/lib/api'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Something went wrong while communicating with the MenuForge API.')
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false
        }

        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
