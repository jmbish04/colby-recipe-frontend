# Product Requirements Document: MenuForge - Your AI Sous Chef

## 1. Vision Statement

To transform the home cooking experience from a daily chore into a moment of creativity and delight. MenuForge will be an intelligent, personal sous chef that understands your tastes, your pantry, and even your unique kitchen appliances, making meal planning, shopping, and cooking a seamless and joyful journey.

## 2. Overall User Stories

* **As a busy professional**, I want an app that can quickly suggest recipes based on ingredients I have, so I can cook a healthy meal without a trip to the store.
* **As an adventurous home cook**, I want to discover new recipes that match my taste profile and get help adapting them to my specific kitchen gadgets, so I can expand my culinary skills.
* **As a family meal planner**, I want to automate my weekly menu and shopping list, saving me time and reducing food waste.
* **As someone with dietary restrictions**, I want to feel confident that the recipes I find are safe and tailored to my needs, without having to double-check every ingredient.

---

## 3. Page: The "For You" Dashboard

### Page Description

The Dashboard is the app's dynamic and personalized home. It's the primary surface for discovery, proactively offering inspiration tailored to the user's context.

### Features

* **Personalized Recipe Carousel**: A horizontally scrolling list of recipe suggestions based on the user's profile.
* **AI Ingredient Chat**: A prominent call-to-action to get instant recipe ideas from on-hand ingredients.
* **Themed Collections**: Dynamic rows of recipes based on themes like seasonality, cuisine, or cooking methods.

### User Stories

* As a user, I want to see recipes that are recommended specifically for me as soon as I open the app.
* As a user, I want to quickly type in a few ingredients and get an immediate, inspiring recipe suggestion without navigating away from the home screen.
* As a user, I want to discover recipes based on themes that are relevant to me, like "Quick Dinners" or "Recipes for my Air Fryer."

### Backend API Utilization

* `GET /api/recipes` (with user token for personalization)
* `POST /api/chat/ingredients`
* `GET /api/themes/suggest`

---

## 4. Page: The AI Sous Chef (Chat)

### Page Description

A full-screen, multi-modal, conversational interface that acts as the user's primary cooking assistant. It's a generative UI that goes beyond text to provide rich, interactive components.

### Features

* **Multi-Modal Input**: Accepts text, voice (via microphone), and image uploads.
* **Generative Recipe Cards**: Dynamically renders recipe cards within the chat, including images, markdown instructions, and interactive ingredient lists.
* **Contextual Actions**: Provides buttons for follow-up actions like adding ingredients to a shopping list, adapting the recipe for an appliance, or asking for substitutions.

### User Stories

* As a user, I want to be able to take a picture of my refrigerator's contents and ask, "What can I make with this?".
* As a user, I want to speak my ingredients into the app and get recipe ideas back.
* As a user, when I get a recipe suggestion in chat, I want to be able to add the missing ingredients to my shopping list with a single click.

### Backend API Utilization

* `POST /api/transcribe`
* `POST /api/ingest/image`
* `POST /api/chat/ingredients`
* `POST /api/menus/:id/shopping-list` (indirectly, by adding to a list)

---

## 5. Page: My Kitchen (Appliance Hub)

### Page Description

A digital inventory of the user's kitchen appliances. This is where users "teach" the app about their specific tools to unlock hyper-personalized cooking instructions.

### Features

* **Appliance Grid**: A visual display of all registered appliances.
* **Add Appliance Wizard**: A simple form to add a new appliance by providing its brand, model, and an optional PDF manual.
* **Asynchronous Processing UI**: Clear visual feedback (spinners, progress bars, status text) to show that a manual is being uploaded and analyzed by the backend.
* **Appliance Detail View**: Shows the AI-extracted information from the manual and allows the user to edit it.

### User Stories

* As a user, I want to add my specific air fryer model to the app by uploading its PDF manual, so the app knows its capabilities.
* As a user, I want to see that my manual is being processed and get notified when it's ready.
* As a user, I want to be able to correct any information the AI may have gotten wrong about my appliance.

### Backend API Utilization

* `POST /api/kitchen/appliances`
* `GET /api/kitchen/appliances`
* `GET /api/kitchen/appliances/:id/status` (polling)
* `PUT /api/kitchen/appliances/:id`
* `DELETE /api/kitchen/appliances/:id`

---

## 6. Page: Recipe Detail & Cooking Conductor

### Page Description

A redesigned, interactive recipe page focused on making the cooking process itself smooth, organized, and stress-free.

### Features

* **Phased Ingredient Prep**: Ingredients are grouped into collapsible sections based on when they are needed in the recipe.
* **Visual Flowchart**: A Mermaid.js diagram that provides a high-level visual overview of the entire cooking workflow, including timings and parallel tasks.
* **Appliance Adaptation**: A one-click button to adapt the recipe instructions for any of the user's registered "Smart Kitchen" appliances.
* **Printable View**: Generates a clean, printable PDF that includes the phased prep list and the visual flowchart.

### User Stories

* As a user, I want to see ingredients grouped by what I need to prep first, so I can do all my chopping at once.
* As a user, I want to see a visual map of the recipe steps before I start, so I can understand the timing and workflow.
* As a user, I want to click a button to see exactly how to make this recipe in my specific Tokit Cook Machine, based on the manual I uploaded.

### Backend API Utilization

* `GET /api/recipes/:id`
* `GET /api/recipes/:id/flowchart`
* `POST /api/recipes/:id/adapt`
* `GET /api/recipes/:id/print`
