# Prompt Phase 6 Kickoff

## Phase 5 Summary
- Completed **TASK-301** delivering the recipe catalog (`/recipes`) with searchable shadcn cards, quick actions, and create/edit/delete dialogs wired to optimistic TanStack Query mutations.
- Shipped the recipe detail route (`/recipes/:id`) with tabbed ingredients/instructions/equipment, inline edit/delete affordances, and WCAG-focused keyboard/focus management.
- Implemented `useRecipes` + `useRecipeDetail` hooks, Worker mock CRUD endpoints for `/api/recipes`, Vitest coverage for listing/detail flows, and documentation updates across README + project task tracker.
- Captured the foundation for future personalization by aligning API contracts, validation, and toast patterns with existing appliance orchestration conventions.

## Phase 6 Objectives: Adaptive Recipe Intelligence

### Primary Task (TASK-302): Tailored Workflow & Visualization
- [ ] **SUB-302-1**: Add a "Workflow" tab to the recipe detail page that renders Mermaid diagrams fetched from `GET /api/recipes/:id/flowchart` with loading/error states.
- [ ] **SUB-302-2**: Implement a "Tailor for my kitchen" action that posts to `POST /api/recipes/:id/tailor`, streams tailored instructions, and updates a comparison view (tabs or side-by-side) without losing base data.
- [ ] **SUB-302-3**: Extend TanStack Query hooks (`useRecipeFlowchart`, `useTailoredRecipe`) with caching, refetch policies, and optimistic placeholders consistent with existing patterns.
- [ ] **SUB-302-4**: Build Worker mock endpoints for flowcharts + tailoring (including SSE simulation), supporting multiple appliances and error scenarios.
- [ ] **SUB-302-5**: Ensure WCAG 2.1 AA compliance for the new visualization/tailoring experiences (focus order, live regions, keyboard interactions for toggles/tabs).

### Supporting Enhancements
- Integrate a reusable streaming helper (mirroring chat SSE handling) for tailoring responses.
- Add toast + activity indicators for tailoring progress, retries, and failure fallbacks.
- Prefetch flowchart data when navigating from the catalog to minimize perceived latency.

### Worker Mock Extensions Required
- `GET /api/recipes/:id/flowchart` – Returns Mermaid definition + metadata (updated timestamp, recommended start appliances).
- `POST /api/recipes/:id/tailor` – Streams tailored instruction blocks keyed by appliance context with simulated delays and retryable error payloads.
- Optional: `GET /api/recipes/:id/tailor/history` for caching previous tailoring runs (stub for later phases).

### Technical Implementation Guidelines
- **Streaming**: Reuse the fetch + ReadableStream approach (no native `EventSource`) to handle SSE-style tailoring updates, buffering tokens for smooth UI rendering.
- **State Management**: Keep base recipe detail cached; store tailored results in a sibling query cache keyed by recipe + appliance set.
- **Visualization**: Use a Mermaid renderer (existing dependency or lightweight wrapper) with accessible fallbacks when diagrams fail to parse.
- **UI Composition**: Build on existing shadcn tabs/cards; ensure toggles or segmented controls announcing context to screen readers.
- **Error Handling**: Surface actionable errors (retry, view logs) and maintain optimistic UI states until Worker mocks resolve.

### Quality Gates
- [ ] Run `npm run lint` – Must pass without errors.
- [ ] Run `npm run test` – Include new tailoring/flowchart tests.
- [ ] Run `npm run build` – Production build must succeed.
- [ ] Run `npx wrangler deploy --dry-run` – Validate Worker changes.

### Documentation & Artifacts
- Update `README.md` with tailoring + visualization details.
- Mark TASK-302 (and subs) as completed in `project_tasks.json` with notes + completion date.
- Append a "Phase 6" section to this prompt + create `PROMPT_PHASE_7.md` when complete.
- Capture refreshed desktop + mobile screenshots covering the workflow visualization and tailoring comparison view, storing the images outside the repo (attach via PR description links) to avoid binary files in git history.

### Handoff Notes
- Align tailoring UX language with existing toast deduplication keys to avoid duplicates.
- Keep accessibility high-priority: ensure streamed updates announce progress via `aria-live` or inline status chips.
- Coordinate Worker mock schema with backend expectations documented in EPIC-3 to minimize future integration friction.
