# Prompt Phase 4 Kickoff

## Phase 3 Summary
- Completed **TASK-201** with a responsive shadcn appliance grid, accessible dialogs, and alert dialogs showcasing CRUD flows.
- Implemented TanStack Query hooks for listing, uploading (multipart), and deleting appliances with optimistic cache updates, simulated progress, and background polling.
- Extended the Cloudflare Worker mocks for `/api/kitchen/appliances` CRUD and added integration tests validating load/add/delete flows.
- Refined toast deduplication and documentation across `README.md`, `PROMPT_PHASE_3.md`, and `project_tasks.json`.

## Objectives Checklist (Phase 4)
- [x] **TASK-202**: Implement asynchronous manual processing UI with conditional polling and status transitions.
  - [x] SUB-202-1: Create `useApplianceStatus` hook that polls `/api/kitchen/appliances/:id` with `refetchInterval`.
  - [x] SUB-202-2: Ensure polling only runs while status is QUEUED/PROCESSING and pauses otherwise.
  - [x] SUB-202-3: Surface badges/spinner/progress updates inside `ApplianceCard` for intermediate states.
  - [x] SUB-202-4: Fire deduplicated toasts when processing completes in the background.
  - [x] SUB-202-5: Handle error states with retry affordances in the UI and Worker mocks.
- [x] Update docs (`README.md`, this prompt, project_tasks.json) with new behaviours when TASK-202 completes.
- [ ] Capture refreshed desktop + mobile screenshots of the Kitchen Hub UI once polling UX lands.
- [ ] Run `npm run lint`, `npm run test`, `npm run build`, and `npx wrangler deploy --dry-run` before handing off.

### Phase 4 progress notes

- Added `useApplianceStatus` and `useRetryApplianceProcessingMutation` hooks so each card polls its detail endpoint only while manuals are queued or processing, raising deduplicated success/error toasts when background transitions occur.
- Enhanced `ApplianceCard` with queued/processing badges, inline spinners, progress feedback, error messaging, and retry controls wired to the new Cloudflare Worker `/retry` action and failure simulations.
- Updated Worker mocks and integration tests to cover queued → processing → ready transitions, background completion, and retry recovery paths for failed manuals.

## Technical & Architectural Notes
- `useAppliancesQuery` already polls while any appliance is `processing`; extend or compose with a per-appliance hook to satisfy TASK-202 without over-polling.
- Worker mocks live in `worker/index.ts`; reuse `scheduleProcessing` helpers and introduce failure/retry cases for error handling scenarios.
- Toast deduplication keys now include the toast kind—use consistent messaging (e.g., `showSuccessToast('Manual ready')`) to avoid duplicates.
- Integration tests (`src/routes/__tests__/kitchen-hub.test.tsx`) demonstrate how to stub fetch; extend them to cover polling state transitions.

## References & Artifacts
- `README.md` – Smart Kitchen Hub overview and next-step guidance.
- `PROMPT_PHASE_3.md` – Completed phase recap and QA summary.
- `project_tasks.json` – TASK-201 marked complete; TASK-202 checklist ready for updates.
- Screenshots captured for Phase 3 (desktop & mobile) – attach in the upcoming PR.
