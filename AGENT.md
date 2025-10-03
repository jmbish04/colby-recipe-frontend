### **`AGENT.md`**

**Source of truth for developers working on the MenuForge Frontend.**

#### **What this repo is**

* A **React (Vite + TypeScript)** single-page application that serves as the user-facing interface for the Colby Recipe Backend.
* It utilizes **shadcn/ui** for its component library, styled with **Tailwind CSS**.
* This is a client-side application and does **not** use a framework like Next.js. Routing is handled by a library like `react-router-dom`.
* It is designed to be a highly interactive, agentic, and user-centric "Smart Kitchen" application.

---

#### **Core Frontend Principles**

* **Optimistic UI**: For actions like adding a favorite or an item to a shopping list, the UI should update immediately while the API request is in flight.
* **Component Modularity**: Every feature, especially complex ones like the AI chat or appliance hub, should be built as a self-contained, reusable component.
* **State Management**: Use a modern state management library (e.g., Zustand or Jotai) to handle global state like user authentication, preferences, and pantry items.
* **Generative UI**: The app should be capable of dynamically rendering complex, interactive components based on API responses, particularly within the AI chat interface.

---

#### **Key Feature Areas & Backend Integration**

1.  **The AI Sous Chef (Chat Interface)**
    * A multi-modal chat experience that accepts text, voice (`/api/transcribe`), and image uploads (`/api/ingest/image`).
    * Dynamically renders recipe cards, ingredient lists, and action buttons based on AI responses. This is not a simple text display; it parses the AI's output to create interactive UI elements.
    * Integrates with the shopping list and recipe adaptation features directly from the chat.

2.  **The Smart Kitchen Hub (Appliance Management)**
    * Provides full CRUD functionality for a user's kitchen appliances using the `/api/kitchen/appliances` endpoints.
    * Handles file uploads for PDF manuals, sending them to the backend for asynchronous processing.
    * Polls the `/api/kitchen/appliances/:id/status` endpoint to show the user the real-time processing state of their uploaded manual (e.g., "Uploading...", "Analyzing Manual...", "Ready!").

3.  **The Cooking Conductor (Recipe View)**
    * Displays recipes with a clear, phased preparation structure, using the `prep_phases` data from the `GET /api/recipes/:id` response.
    * Fetches and renders a `Mermaid.js` flowchart by calling `GET /api/recipes/:id/flowchart`.
    * Allows users to trigger the `/api/recipes/:id/adapt` endpoint to get tailored instructions for their registered appliances and displays the results in a clear, side-by-side or tabbed view.

---

#### **Setup & Tooling**

* **Package Manager**: `npm` or `yarn`
* **Build Tool**: Vite
* **UI**: React, shadcn/ui, Tailwind CSS
* **Routing**: `react-router-dom`
* **State Management**: Zustand (recommended)
* **Data Fetching**: `react-query` (TanStack Query) for caching, refetching, and managing server state.

---

#### **Do / Don’t**

* **Do** use `react-query` to manage the caching of API data like recipes, preferences, and pantry items. This will make the app feel faster and reduce redundant API calls.
* **Do** create a centralized API client or a set of custom hooks (`useRecipes`, `usePantry`, etc.) to interact with the backend.
* **Don’t** store sensitive information like the `WORKER_API_KEY` in the frontend code. This key should only be used in a secure backend-for-frontend (BFF) if needed, but for a direct client-to-worker architecture, user-specific tokens are the primary security mechanism.
* **Don’t** embed the Mermaid.js definition directly. Fetch it from the API and render it dynamically to ensure it's always up-to-date with the recipe.
