import { create, type StoreApi } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export type User = {
  id: string
  email: string
  name: string
  avatarUrl?: string
  roles?: string[]
}

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated'

export interface SessionPayload {
  accessToken: string
  refreshToken?: string | null
  expiresIn?: number
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: number | null
  user: User | null
  status: AuthStatus
  setSession: (payload: SessionPayload) => void
  setUser: (user: User | null) => void
  logout: () => void
}

type PersistedAuthState = Pick<AuthState, 'accessToken' | 'refreshToken' | 'accessTokenExpiresAt' | 'user'>

const inMemoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const storage = createJSONStorage<PersistedAuthState>(() => {
  if (typeof window === 'undefined') {
    return inMemoryStorage
  }

  return window.sessionStorage
})

let authStoreApi: StoreApi<AuthState> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get, api) => {
      authStoreApi = api

      return {
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        user: null,
        status: 'idle',
        setSession: ({ accessToken, refreshToken, expiresIn }) => {
          const expiresAt = typeof expiresIn === 'number' ? Date.now() + expiresIn * 1000 : get().accessTokenExpiresAt
          set({
            accessToken,
            refreshToken: refreshToken ?? get().refreshToken,
            accessTokenExpiresAt: expiresAt ?? null,
            status: 'authenticated',
          })
        },
        setUser: (user) => {
          set({ user, status: user ? 'authenticated' : get().status })
        },
        logout: () => {
          set({ accessToken: null, refreshToken: null, accessTokenExpiresAt: null, user: null, status: 'unauthenticated' })
        },
      }
    },
    {
      name: 'menuforge-auth',
      storage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        const hasToken = Boolean(state?.accessToken)
        authStoreApi?.setState({ status: hasToken ? 'authenticated' : 'unauthenticated' })
      },
    },
  ),
)

export const selectIsAuthenticated = (state: AuthState) => state.status === 'authenticated'
export const selectAuthStatus = (state: AuthState) => state.status
export const selectAuthUser = (state: AuthState) => state.user
export const selectAccessToken = (state: AuthState) => state.accessToken
export const selectRefreshToken = (state: AuthState) => state.refreshToken
