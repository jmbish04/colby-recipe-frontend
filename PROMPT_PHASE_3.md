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

## Validation & Quality Gates
- `npm run lint`
- `npm run build`
- `npx wrangler deploy --dry-run`
- Relevant integration/unit tests (`npm run test` once introduced).

## Artifacts
- Capture fresh screenshots highlighting the Smart Kitchen Hub appliance list on desktop and mobile.
- Include test results and deployment dry-run logs in the PR description.
