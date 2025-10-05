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

## Design system

The design system is built with shadcn/ui primitives and a shared token layer:

- `src/components/ui` hosts the generated primitives plus additional navigation and sheet patterns.
- Composite widgets such as recipe summaries and ingredient readiness views live in `src/components/recipe-card.tsx` and `src/components/ingredient-list.tsx`.
- Global CSS variables for color, typography, and spacing live in `src/index.css` and feed Tailwind via `tailwind.config.js`.
- Dark mode is powered by [`next-themes`](https://github.com/pacocoursey/next-themes) with a `ThemeToggle` control in `src/components/theme-toggle.tsx`.
- Toast notifications use the themed `sonner` integration in `src/components/ui/sonner.tsx`.

## Routing & navigation

- `src/App.tsx` defines route-based code splitting with React Router, loading feature areas on demand via `React.lazy` and `Suspense`.
- `src/components/layout/app-shell.tsx` renders the shared app chrome, desktop navigation menu, and mobile sheet navigation with TanStack Query route prefetching plus WCAG-friendly labelling for keyboard and screen-reader use.
- Navigation automatically prefetches the two most likely next routes after each transition and hints additional data when links receive hover, focus, or touch interactions.
- Individual route modules under `src/routes/` (chat, kitchen hub, recipes, planner) pull data via suspense-enabled hooks in `src/lib/routeData.ts` to showcase loading states and layout patterns.

## Authentication & data layer

- `src/lib/api.ts` hosts a resilient `fetch` wrapper that automatically attaches bearer tokens, handles JSON parsing, and refreshes tokens when they are close to expiry or when a `401` is returned.
- `src/lib/queryClient.ts` centralises the TanStack Query client with global error toasts and sensible defaults for retries and stale times.
- `src/stores/useAuthStore.ts` is a persisted Zustand store that keeps the current session, user profile, and helper selectors in sync across tabs via `sessionStorage`.
- `src/hooks/useAuth.ts` exposes `useLogin`, `useLogout`, and `useCurrentUser` hooks that compose the API client, React Query, and the store to power UI flows.
- `worker/index.ts` now includes mock `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/me` endpoints so the frontend can simulate realistic auth cycles without a live backend.
- `src/components/auth-panel.tsx` exposes the authentication showcase panel used inside the kitchen hub route alongside the broader navigation shell.
- `src/lib/routeData.ts` simulates feature data and powers TanStack Query prefetching so navigation feels responsive even before real APIs land.

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

## Next steps

- Expand the Cloudflare Worker mocks with kitchen, recipe, and planner endpoints that align with the new routes.
- Replace the placeholder `routeData` fetchers with real TanStack Query hooks that call the Worker.
- Add integration tests covering navigation, login/logout, and token refresh flows across routes.

