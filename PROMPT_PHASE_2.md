# Prompt Phase 2 Handoff

## Summary of Tasks 1-3
- **TASK-101**: Bootstrapped the Vite + React + TypeScript workspace with Cloudflare Worker integration, Tailwind, and routing scaffolding.
- **TASK-102**: Established the shadcn/ui design system, including theming, dark mode, and composite recipe showcase components.
- **TASK-103**: Implemented the auth-ready data layer—centralized API client with token refresh, TanStack Query provider, Zustand auth store with session persistence, auth hooks/UI, and Cloudflare Worker auth mocks.

## Current Project State
- React SPA builds and lints cleanly (`npm run lint`, `npm run build`).
- Application shell demonstrates design system elements plus an `AuthPanel` wired to mock auth endpoints.
- Zustand store persists tokens in `sessionStorage`, auto-refreshes tokens, and keeps query cache synchronized.
- Cloudflare Worker serves `/api/health` and `/api/auth/{login,refresh,me}` mock endpoints mirroring expected JSON contracts.
- Documentation updated to reflect the new authentication/query layer.

## Recommended Next Steps (Phase 2)
1. **TASK-104**: Implement React Router app shell, navigation, and route-level code-splitting.
2. Define feature routes (e.g., chat, kitchen hub, recipe view) and connect them to TanStack Query hooks.
3. Expand Worker mocks for kitchen/recipe endpoints to unblock UI development.
4. Add integration tests covering login/logout and token refresh flows (Vitest + Testing Library).
5. Evaluate toast deduplication and query error UX once more endpoints exist.

## Ready-to-Use Prompt for Next Phase
```
Open project_tasks.json and continue with TASK-104.
- Build the React Router app shell with desktop + mobile navigation using shadcn components.
- Implement lazy-loaded route modules for the primary feature areas (chat, kitchen hub, recipes, planner).
- Ensure navigation state reflects the active route and includes accessible labels.
- Wire TanStack Query prefetching for likely next routes.
- Update README and project_tasks.json (status, notes, date) when TASK-104 is complete.
- Run `npm run lint` and `npm run build` before committing.
- Provide screenshots of new navigation experiences.
```

## Technical Decisions & Patterns
- **API Client**: All HTTP requests flow through `src/lib/api.ts`, which handles JSON parsing, auth headers, and token refresh with exponential guard against infinite retries.
- **State Management**: `src/stores/useAuthStore.ts` persists session tokens in `sessionStorage`, rehydrates status automatically, and exposes selector helpers for components/hooks.
- **Data Fetching**: `src/lib/queryClient.ts` centralizes TanStack Query defaults (stale times, retry policy, toast-based error reporting).
- **Auth Hooks**: `src/hooks/useAuth.ts` composes the API client and store to expose `useLogin`, `useLogout`, and `useCurrentUser` hooks with React Query caching.
- **Mock Backend**: `worker/index.ts` simulates realistic auth flows, encoding user identity in mock tokens so `/auth/me` and `/auth/refresh` return consistent identities.
