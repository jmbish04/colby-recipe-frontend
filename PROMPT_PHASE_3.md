# Prompt Phase 3 Kickoff

## Objective
Advance EPIC-2 by delivering TASK-201: a Smart Kitchen Hub appliance list that showcases CRUD flows, multipart uploads, and responsive feedback across desktop and mobile breakpoints.

## Context Recap
- The app shell now provides accessible desktop navigation and a mobile sheet menu with TanStack Query route prefetching.
- Feature routes for chat, kitchen hub, recipes, and planner are lazy loaded with suspense fallbacks via `src/lib/routeData.ts` mocks.
- Authentication scaffolding (API client, Zustand store, TanStack Query provider) is live with Cloudflare Worker auth mocks.

## Primary Task — TASK-201
1. Build the "My Kitchen" appliance list UI using shadcn components (`card`, `dialog`, `form`, `progress`, `alert-dialog`).
2. Implement TanStack Query hooks for:
   - Listing appliances (`GET /api/kitchen/appliances`).
   - Creating appliances with multipart uploads (`POST /api/kitchen/appliances`).
   - Deleting appliances with confirmation (`DELETE /api/kitchen/appliances/:id`).
3. Provide optimistic UX: progress indicators during uploads, status badges, and immediate list updates.
4. Ensure WCAG 2.1 AA compliance (focus management, aria-labels, keyboard support) across list, forms, and dialogs.

## Supporting Work
- Expand Worker mocks in `worker/index.ts` to cover the new appliance endpoints, including simulated processing states.
- Add integration tests (Vitest + Testing Library) that cover loading, adding, and removing appliances.
- Revisit toast deduplication/error handling with the new mutations.

## Deliverables
- Updated UI components, hooks, and Worker mocks that fulfill TASK-201.
- Documentation updates in `README.md` and `PROMPT_PHASE_3.md` (this file) describing the new appliance features and any configuration steps.
- `project_tasks.json` entries updated with accurate status, notes, and completion date for TASK-201 and related subtasks.

## Implementation Notes
- Added `src/routes/kitchen-hub.tsx` appliance manager with shadcn cards, dialogs, alert dialogs, and progress bars powered by new TanStack Query hooks for listing, creating, and deleting appliances.
- Introduced `src/hooks/useAppliances.ts` for `GET`, `POST`, and `DELETE /api/kitchen/appliances` with optimistic cache updates and simulated upload progress to keep the UI responsive.
- Extended `worker/index.ts` to mock appliance endpoints, validate multipart uploads, and simulate manual processing transitions.
- Created `src/routes/__tests__/kitchen-hub.test.tsx` integration tests (Vitest + Testing Library) covering loading, adding, and deleting appliances.
- Added `vitest.setup.ts`, updated `vite.config.ts`, and wired `npm run test` into the toolchain to support the new test suite.

## Validation & Quality Gates
- `npm run lint`
- `npm run build`
- `npx wrangler deploy --dry-run`
- Relevant integration/unit tests (`npm run test` once introduced).

## Artifacts
- Capture fresh screenshots highlighting the Smart Kitchen Hub appliance list on desktop and mobile.
- Include test results and deployment dry-run logs in the PR description.
