Absolutely. Here is the updated `AGENT.md` based on the provided project documentation.

***

### **`AGENT.md`**

**Source of truth for developers working on the MenuForge Frontend.**

#### **What this repo is**

* A **React (Vite + TypeScript)** single-page application (SPA) that serves as the user-facing interface for the MenuForge backend.
* It utilizes **shadcn/ui** for its component library, styled with **Tailwind CSS**.
* This is a pure client-side application and **does not** use a framework like Next.js or any Server-Side Rendering (SSR). Routing is handled by **`react-router-dom`**.
* The application is deployed as static assets served by **Cloudflare**, with a backend API powered by a **Cloudflare Worker**.

---

#### **Core Frontend Principles**

* **Optimistic UI**: For actions like favoriting a recipe or adding a pantry item, the UI updates immediately while the API request is in flight to feel instantaneous.
* **Component Modularity**: Features are built as self-contained, reusable components, leveraging shadcn/ui's composition patterns.
* **State Management**: A clear separation of concerns:
    * **Zustand** is used for global client state (e.g., auth, theme).
    * **TanStack Query** is used for all server state (caching, refetching, and mutating API data).
* **Generative UI**: The app dynamically renders complex, interactive components based on API responses, particularly within the AI chat, creating a rich user experience beyond simple text.
* **Offline-First (PWA)**: The application is a Progressive Web App designed to work offline, caching critical data and assets using a service worker.
* **Accessibility**: The application must adhere to WCAG 2.1 AA standards, ensuring it is navigable and usable for everyone.

---

#### **Cloudflare Workers Integration**

The frontend is tightly coupled with the Cloudflare ecosystem.

* **Local Development**: Running `npm run dev` uses the `@cloudflare/vite-plugin` to start a local server that emulates the Cloudflare runtime, providing access to bindings and a production-like environment.
* **SPA Routing**: The `wrangler.jsonc` file is configured with `"not_found_handling": "single-page-application"`. This ensures that any direct navigation request that doesn't match a static file serves the `index.html`, allowing React Router to take control.
* **API Routing**: The configuration `"run_worker_first": ["/api/*"]` directs all requests starting with `/api/` to the Cloudflare Worker *before* attempting to serve a static asset. This is the primary mechanism for client-backend communication.
* **File Uploads**: All file uploads (PDFs, images) use the `FormData` API and are subject to the Cloudflare Worker's 100MB request size limit.

---

#### **Key Feature Areas & Backend Integration**

1.  **The AI Sous Chef (Chat Interface)**
    * A multi-modal chat experience that accepts text, voice (`POST /api/transcribe`), and image uploads (`POST /api/ingest/image`).
    * Handles real-time streaming responses from `POST /api/chat` using Server-Sent Events (SSE). The client should use `fetch` with a `ReadableStream` for fine-grained control.
    * Parses structured JSON from the AI's output to dynamically render interactive recipe cards and other UI elements within the chat history.

2.  **The Smart Kitchen Hub (Appliance Management)**
    * Provides full CRUD functionality for kitchen appliances using the `/api/kitchen/appliances` endpoints.
    * Handles `multipart/form-data` uploads for PDF manuals, showing upload progress to the user.
    * Implements an asynchronous processing UI. After an upload, the frontend polls the `GET /api/kitchen/appliances/:id` endpoint (using TanStack Query's `refetchInterval`) to check the processing status included in the appliance object and update the UI accordingly (e.g., "Processing...", "Ready!").

3.  **The Cooking Conductor (Recipe View)**
    * Displays recipes with phased ingredient preparation lists.
    * Fetches a Mermaid.js diagram definition from `GET /api/recipes/:id/flowchart` and renders it as a visual workflow.
    * Allows users to trigger `POST /api/recipes/:id/tailor` to get tailored instructions for their registered appliances, displaying the results in a clear comparison view (e.g., tabs or side-by-side).

4.  **Menu & Pantry Management**
    * Features a drag-and-drop weekly calendar for meal planning.
    * Supports one-click AI menu generation via `POST /api/menus/generate`.
    * Generates a shopping list from a menu plan (`POST /api/menus/:id/shopping-list`) that automatically excludes items the user already has in their pantry (pantry-aware deduplication).

---

#### **Setup & Tooling**

* **Package Manager**: `npm`
* **Build Tool**: Vite
* **UI Framework**: React 18+ with TypeScript
* **Component Library**: shadcn/ui
* **Styling**: Tailwind CSS
* **Routing**: `react-router-dom`
* **State Management**: Zustand (client) & TanStack Query (server)
* **Forms**: `react-hook-form` with `zod` for validation
* **Testing**: Vitest (Unit), React Testing Library (Integration), Playwright (E2E)

---

#### **Do / Don’t**

* **Do** use TanStack Query for managing all server state. It handles caching, retries, and polling logic out of the box.
* **Do** create a centralized API client and a set of custom hooks (`useRecipes`, `usePantry`, etc.) for all backend interactions.
* **Do** use `React.lazy()` and `Suspense` for route-based code splitting to keep the initial bundle small.
* **Do** use the shadcn `form` component, which integrates `react-hook-form` and `zod` for robust and accessible forms.
* **Don’t** use Next.js or any other SSR framework. This project is architected as a pure client-side SPA.
* **Don’t** store sensitive information or API keys in the frontend code. Authentication relies on user-specific tokens managed by the auth flow.
* **Don’t** embed static data like Mermaid definitions directly in components. Fetch them from the API to ensure they are always up-to-date.
* **Don't** use the native `EventSource` API for streaming. Use `fetch` with a `ReadableStream` to have better control over the request lifecycle and error handling, as specified in the implementation details.

---

#### **Process Requirements**

* **Always** run and pass `npm run lint`, `npm run build`, and `npx wrangler deploy --dry-run` before opening a PR.
* Update `project_tasks.json` so that every touched task has an accurate status, notes, and completion date.
* Keep documentation synchronized: update the current `PROMPT_PHASE_{n}.md`, add the next sequential `PROMPT_PHASE_{n+1}.md` handoff prompt, and reflect feature changes in `README.md`.
* Capture required screenshots (desktop + mobile when UI changes are visible) and attach them to the PR description. Host the images outside the repo and link them instead of committing binary assets so PR tooling remains functional.
