# Prompt Phase 6 Kickoff

## Phase 5 Summary
- Completed **TASK-301** delivering the recipe catalog (`/recipes`) with searchable shadcn cards, quick actions, and create/edit/delete dialogs wired to optimistic TanStack Query mutations.
- Shipped the recipe detail route (`/recipes/:id`) with tabbed ingredients/instructions/equipment, inline edit/delete affordances, and WCAG-focused keyboard/focus management.
- Implemented `useRecipes` + `useRecipeDetail` hooks, Worker mock CRUD endpoints for `/api/recipes`, Vitest coverage for listing/detail flows, and documentation updates across README + project task tracker.
- Captured the foundation for future personalization by aligning API contracts, validation, and toast patterns with existing appliance orchestration conventions.

## Phase 6 Objectives: Generative Recipe Intelligence

### Primary Task (TASK-302): Implement Generative Recipe Card UI in Chat
- [x] **SUB-302-1**: Create a shadcn-powered `RecipeCard` composite in `src/components/recipes/RecipeCard.tsx` with badges, accordions, ingredient checkboxes, markdown instructions, and action buttons.
- [x] **SUB-302-2**: Parse AI chat payloads for `{ type: 'recipe', data }` envelopes and branch rendering between plain-text and rich cards inside the chat route.
- [x] **SUB-302-3**: Wire the generative card to navigate to `/recipes/:id` when activated from any non-interactive surface area.
- [x] **SUB-302-4**: Implement a TanStack Query mutation that optimistically posts selected ingredients to `/api/shopping-list`, surfacing toasts and inline status feedback.
- [x] **SUB-302-5**: Render markdown instructions via `react-markdown` with accessible list semantics and typography tokens.
- [x] **SUB-302-6**: Introduce Worker support for `/api/shopping-list` so optimistic additions reconcile against the mock backend.

### Supporting Enhancements
- Added a shadcn `Checkbox` primitive to unlock ingredient checklist interactions.
- Extended chat route data with realistic multi-message transcripts and a hero salmon recipe seeded with phased ingredients.
- Applied WCAG-friendly focus, aria-live messaging, and large tap targets for the generative recipe card.

### Quality Gates
- [x] Run `npm run lint` – Must pass without errors.
- [x] Run `npm run test` – Update or add tests validating chat rendering.
- [x] Run `npm run build` – Production build must succeed.
- [x] Run `npx wrangler deploy --dry-run` – Validate Worker changes.

### Documentation & Artifacts
- Update `README.md` with generative chat details and Worker shopping list coverage.
- Mark TASK-302 (and subs) as completed in `project_tasks.json` with notes + completion date.
- Create `PROMPT_PHASE_7.md` capturing the handoff for the next milestone.
- Capture refreshed desktop + mobile screenshots of the AI Sous Chef chat showcasing the recipe card experience (host externally for PR attachments).

### Handoff Notes
- Maintain toast deduplication semantics when adding future chat actions (e.g., save/favorite) so optimistic feedback remains clean.
- Future streaming work should reuse the existing chat parsing guard to hydrate partial recipe payloads safely when SSE tokens arrive incrementally.
- Consider promoting the shopping list mutation into a reusable hook if other surfaces need to add multiple ingredients in bulk.
