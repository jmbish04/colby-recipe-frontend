# MenuForge Frontend

MenuForge is an AI-powered recipe management and meal planning experience built with React, Vite, and TypeScript. This repository contains the Cloudflare-first frontend that ships as a static Progressive Web App backed by a Cloudflare Worker for API routing.

## Tech stack

- **React 18** with TypeScript
- **Vite 7** bundler with the official React plugin
- **Tailwind CSS 3** for utility-first styling
- **React Router v6** for client-side routing
- **Cloudflare Workers** runtime via `@cloudflare/vite-plugin` and `wrangler`
- **shadcn/ui** components with a custom MenuForge design system theme

## Getting started

```bash
npm install
npm run dev
```

This starts the application with `wrangler dev`, which serves the Vite development build inside a Cloudflare Worker at [http://localhost:8787](http://localhost:8787). A simple `/api/health` endpoint is exposed by the worker for runtime validation.

## Available scripts

- `npm run dev` – start the Cloudflare-aware development server
- `npm run build` – type-check and build the production bundle to `dist`
- `npm run preview` – preview the production build using `wrangler pages dev`
- `npm run lint` – lint the codebase with ESLint and TypeScript rules
- `npm run test` – run the Vitest + Testing Library suite

## Design system

The design system is built with shadcn/ui primitives and a shared token layer:

- `src/components/ui` hosts the generated primitives plus additional navigation and sheet patterns.
- Composite widgets such as recipe summaries, generative chat recipe cards, and ingredient readiness views live in
  `src/components/recipe-card.tsx`, `src/components/recipes/RecipeCard.tsx`, and `src/components/ingredient-list.tsx`.
- Global CSS variables for color, typography, and spacing live in `src/index.css` and feed Tailwind via `tailwind.config.js`.
- Dark mode is powered by [`next-themes`](https://github.com/pacocoursey/next-themes) with a `ThemeToggle` control in `src/components/theme-toggle.tsx`.
- Toast notifications use the themed `sonner` integration in `src/components/ui/sonner.tsx`.

## Routing & navigation

- `src/App.tsx` defines route-based code splitting with React Router, loading feature areas on demand via `React.lazy` and `Suspense`.
- `src/components/layout/app-shell.tsx` renders the shared app chrome, desktop navigation menu, and mobile sheet navigation with TanStack Query route prefetching plus WCAG-friendly labelling for keyboard and screen-reader use.
- Navigation automatically prefetches the two most likely next routes after each transition and hints additional data when links receive hover, focus, or touch interactions.
- Individual route modules under `src/routes/` (chat, kitchen hub, recipes, planner) pull data via suspense-enabled hooks in `src/lib/routeData.ts` to showcase loading states and layout patterns. The recipes area now includes both `/recipes` for the catalog and `/recipes/:id` for detail pages with lazy-loaded boundaries.

## Authentication & data layer

- `src/lib/api.ts` hosts a resilient `fetch` wrapper that automatically attaches bearer tokens, handles JSON parsing, and refreshes tokens when they are close to expiry or when a `401` is returned.
- `src/lib/queryClient.ts` centralises the TanStack Query client with global error toasts and sensible defaults for retries and stale times.
- `src/stores/useAuthStore.ts` is a persisted Zustand store that keeps the current session, user profile, and helper selectors in sync across tabs via `sessionStorage`.
- `src/hooks/useAuth.ts` exposes `useLogin`, `useLogout`, and `useCurrentUser` hooks that compose the API client, React Query, and the store to power UI flows.
- `worker/index.ts` now includes mock `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/me` endpoints so the frontend can simulate realistic auth cycles without a live backend.
- `src/components/auth-panel.tsx` exposes the authentication showcase panel used inside the kitchen hub route alongside the broader navigation shell.
- `src/lib/routeData.ts` simulates feature data and powers TanStack Query prefetching so navigation feels responsive even before real APIs land.

## Smart kitchen hub appliances

- `src/routes/kitchen-hub.tsx` renders the "My kitchen appliances" manager with shadcn cards, dialogs, progress bars, and alert dialogs to showcase listing, uploading, and deleting hardware entries across mobile and desktop breakpoints.
- Uploads provide accessible feedback with optimistic cache updates, simulated progress, focus-safe dialog flows, aria-labels, and status badges that surface queued, processing, ready, and error states with inline spinners and progress bars.
- `src/hooks/useAppliances.ts` provides TanStack Query hooks for `GET`, `POST`, and `DELETE` appliance endpoints, composes the per-appliance `useApplianceStatus` polling hook, exposes a retry mutation, and fires deduplicated success/error toasts as manuals complete in the background.
- `worker/index.ts` mocks `/api/kitchen/appliances` REST endpoints including multipart upload validation, delayed processing, manual links, simulated failure states, and a `/retry` action to requeue ingestion attempts.
- Integration coverage for the appliance UX lives in `src/routes/__tests__/kitchen-hub.test.tsx` and now exercises loading, creation, deletion, polling state transitions, and retry flows against mocked fetch responses.

## Recipe intelligence workspace

- `src/routes/recipes/index.tsx` implements the recipe catalog with search, difficulty and tag filters, accessible cards, and optimistic CRUD flows backed by shadcn dialogs and alert confirmation banners.
- `src/routes/recipes/detail.tsx` provides a tabbed recipe detail surface with WCAG-compliant navigation for ingredients, instructions, and equipment along with inline editing and deletion controls.
- `src/routes/chat.tsx` surfaces the AI Sous Chef conversation with quick prompts, pinned threads, and generative recipe cards
  that parse structured AI responses into interactive checklists with TanStack Query shopping list mutations.
- `src/hooks/useRecipes.ts` hosts the TanStack Query hooks (`useRecipes`, `useRecipeDetail`, and CRUD mutations) that manage optimistic caching across list/detail queries and surface consistent toast feedback.
- Worker mocks in `worker/index.ts` now cover `/api/recipes` REST endpoints, including validation, optimistic-friendly timestamps, and queryable search/tag filters so the frontend can iterate without a live backend.
- The Worker also provides `/api/shopping-list` to capture optimistic ingredient additions triggered from chat recipe cards.
- `src/routes/__tests__/recipes.test.tsx` adds Vitest coverage for the listing and detail experiences, ensuring the dialog-powered edits dispatch the correct Worker mutations and update the UI optimistically.

## Project structure

```
.
├── public/              # Static assets copied as-is
├── src/                 # React application source code
│   ├── components/      # shadcn/ui primitives and composite UI widgets
│   ├── hooks/           # Custom React hooks (auth, data access, etc.)
│   ├── lib/             # Shared utilities (API client, query client, helpers)
│   └── stores/          # Global client-side state (Zustand)
├── worker/              # Cloudflare Worker entrypoint
├── wrangler.jsonc       # Cloudflare Pages/Workers configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite + Cloudflare configuration
```

## Cloudflare configuration

The `wrangler.jsonc` file enables SPA routing and directs `/api/*` requests to the Worker before falling back to static assets. When deployed to Cloudflare Pages, this ensures React Router can handle client-side navigation while keeping backend calls within the Worker environment.

## PR workflow tips

- Host UI review screenshots externally (for example, in cloud storage) and link them in pull requests. Avoid committing binary screenshot assets to the repo so that PR automation, including the `make_pr` helper, remains fully functional.

## Next steps

- Validate the manual ingestion flow against the production API once it lands and instrument telemetry around retries/completions so the async UX can be tuned with real data.
- Expand Cloudflare Worker mocks with any additional kitchen/recipe/planner endpoints required for the next milestones.
- Continue replacing simulated `routeData` fetchers with production-ready TanStack Query hooks routed through the Worker as endpoints mature.

