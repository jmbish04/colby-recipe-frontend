# Prompt Phase 7 Kickoff

## Phase 6 Summary
- Implemented the generative `RecipeCard` composite with shadcn cards, accordions, markdown instructions, and TanStack Query-powered shopping list mutations.
- Extended the AI Sous Chef chat to parse `{ type: 'recipe', data }` payloads, conditionally rendering rich recipe cards alongside standard assistant/user bubbles.
- Added Worker support for `/api/shopping-list` to reconcile optimistic ingredient additions, plus a reusable shadcn `Checkbox` primitive for checklist interactions.
- Updated README, project task tracker, and prompts to reflect the generative chat milestone and new infrastructure.

## Phase 7 Objectives: Cooking Conductor Foundation

### Primary Task (TASK-401): Develop Recipe Detail Page with Phased Prep and Flowchart
- [ ] **SUB-401-1**: Create a dedicated `useRecipe` (or reuse `useRecipeDetail`) hook that fetches `GET /api/recipes/:id` with suspense-ready error and loading states.
- [ ] **SUB-401-2**: Build the recipe header with hero image, metadata badges, difficulty indicators, and quick actions.
- [ ] **SUB-401-3**: Implement phased ingredient accordions grouped by preparation stage with accessible keyboard interaction.
- [ ] **SUB-401-4**: Create a `MermaidDiagram` component that renders flowcharts provided by the backend.
- [ ] **SUB-401-5**: Fetch and render flowchart data from `GET /api/recipes/:id/flowchart`, handling loading, error, and retry affordances.
- [ ] **SUB-401-6**: Add print styles and a print-friendly action for the recipe detail page.
- [ ] **SUB-401-7**: Implement a recipe scaling dialog that recalculates ingredient quantities.

### Supporting Enhancements
- Prefetch recipe detail and flowchart data from the catalog to reduce perceived latency.
- Ensure TanStack Query caches base detail and flowchart responses with sensible `staleTime` values.
- Align WCAG 2.1 AA requirements across tabs, accordions, and any new dialogs or print interactions.

### Worker Mock Extensions Required
- `GET /api/recipes/:id/flowchart` – return Mermaid definition, metadata, and updated timestamps.
- Extend existing recipe mocks to include phased ingredient groupings and scaling metadata if necessary.

### Quality Gates
- [ ] Run `npm run lint` – Must pass without warnings or errors.
- [ ] Run `npm run test` – Add/extend coverage for recipe detail tabs, accordions, and flowchart rendering.
- [ ] Run `npm run build` – Production build must succeed.
- [ ] Run `npx wrangler deploy --dry-run` – Validate Worker changes.

### Documentation & Artifacts
- Update `README.md`, this prompt, and `project_tasks.json` when TASK-401 completes.
- Capture refreshed desktop + mobile screenshots of the recipe detail experience, hosting images externally for PR review.
- Provide architectural notes on Mermaid integration and scaling math for future reference.

### Ready-to-Use Prompt for Phase 7 Execution
```
Open project_tasks.json and continue with TASK-401.
- Build the recipe detail view with phased ingredient accordions, Mermaid workflow visualization, and scaling dialog.
- Implement TanStack Query hooks and Worker mocks for `/api/recipes/:id` and `/api/recipes/:id/flowchart` with optimistic UI patterns.
- Ensure WCAG-compliant focus management, keyboard support, and aria-live updates where streaming or printing occurs.
- Update README, project_tasks.json, and PROMPT_PHASE_7.md upon completion, then create PROMPT_PHASE_8.md for the next handoff.
- Run `npm run lint`, `npm run test`, `npm run build`, and `npx wrangler deploy --dry-run` before committing.
- Capture updated desktop + mobile screenshots of the recipe detail experience (host externally) for the PR summary.
```
