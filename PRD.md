# Product Requirements Document: MenuForge - Your AI Sous Chef

## 1. Vision Statement

To transform the home cooking experience from a daily chore into a moment of creativity and delight. MenuForge will be an intelligent, personal sous chef that understands your tastes, your pantry, and even your unique kitchen appliances, making meal planning, shopping, and cooking a seamless and joyful journey.

## 2. Overall User Stories

* **As a busy professional**, I want an app that can quickly suggest recipes based on ingredients I have, so I can cook a healthy meal without a trip to the store.
* **As an adventurous home cook**, I want to discover new recipes that match my taste profile and get help adapting them to my specific kitchen gadgets, so I can expand my culinary skills.
* **As a family meal planner**, I want to automate my weekly menu and shopping list, saving me time and reducing food waste.
* **As someone with dietary restrictions**, I want to feel confident that the recipes I find are safe and tailored to my needs, without having to double-check every ingredient.
* **As a home cook**, I want the app to work even when I lose internet connection while cooking, so I never lose access to my recipe mid-preparation.
* **As a recipe enthusiast**, I want to save and organize my favorite recipes into custom collections, so I can easily find them later.

---

## 3. Page: User Onboarding & Profile Setup

### Page Description

A warm, welcoming first-run experience that helps new users set up their preferences, dietary restrictions, and kitchen inventory. This one-time setup ensures personalized recommendations from day one.

### Features

* **Welcome Carousel**: Brief introduction to MenuForge's key features with engaging visuals
* **Dietary Preferences Wizard**: Multi-step form to capture cuisines, allergens, and dietary restrictions
* **Kitchen Appliance Quick-Add**: Option to add 2-3 primary appliances during onboarding
* **Skip & Continue**: Allow users to skip and explore, then complete profile later
* **Progress Indicator**: Clear visual feedback on completion percentage

### User Stories

* As a new user, I want a simple onboarding process that takes less than 2 minutes, so I can start using the app quickly.
* As a user with dietary restrictions, I want to set my allergens upfront, so I never see recipes containing ingredients I can't eat.
* As a user, I want to skip onboarding and explore the app first, then come back to complete my profile when ready.

### Backend API Utilization

* `PUT /api/prefs` (create initial preferences)
* `POST /api/kitchen/appliances` (optional appliance registration)
* `POST /api/events` (track onboarding completion)

---

## 4. Page: The "For You" Dashboard

### Page Description

The Dashboard is the app's dynamic and personalized home. It's the primary surface for discovery, proactively offering inspiration tailored to the user's context.

### Features

* **Personalized Recipe Carousel**: A horizontally scrolling list of recipe suggestions based on the user's profile
* **AI Ingredient Chat**: A prominent call-to-action to get instant recipe ideas from on-hand ingredients
* **Themed Collections**: Dynamic rows of recipes based on themes like seasonality, cuisine, or cooking methods
* **Recent Activity**: Quick access to recently viewed recipes and current menu plans
* **Quick Actions Bar**: Fast shortcuts to pantry, favorites, and shopping list
* **Offline Banner**: Subtle indicator when offline with cached content availability

### User Stories

* As a user, I want to see recipes that are recommended specifically for me as soon as I open the app.
* As a user, I want to quickly type in a few ingredients and get an immediate, inspiring recipe suggestion without navigating away from the home screen.
* As a user, I want to discover recipes based on themes that are relevant to me, like "Quick Dinners" or "Recipes for my Air Fryer."
* As a user, I want to see my recent activity so I can quickly return to recipes I was looking at.

### Backend API Utilization

* `GET /api/recipes` (with user token for personalization)
* `POST /api/chat/ingredients`
* `GET /api/themes/suggest`
* `GET /api/favorites/{id}` (check favorite status)
* `GET /api/search/suggest` (autocomplete)

---

## 5. Page: The AI Sous Chef (Chat)

### Page Description

A full-screen, multi-modal, conversational interface that acts as the user's primary cooking assistant. It's a generative UI that goes beyond text to provide rich, interactive components.

### Features

* **Multi-Modal Input**: Accepts text, voice (via microphone), and image uploads
* **Generative Recipe Cards**: Dynamically renders recipe cards within the chat, including images, markdown instructions, and interactive ingredient lists
* **Contextual Actions**: Provides buttons for follow-up actions like adding ingredients to a shopping list, adapting the recipe for an appliance, or asking for substitutions
* **Conversation History**: Persists chat history across sessions with ability to clear
* **Streaming Responses**: Real-time text streaming for immediate feedback
* **Voice Input Visualization**: Visual waveform or indicator during voice recording
* **Image Preview**: Show uploaded images with retry option
* **Error Recovery**: Graceful handling of failed requests with retry options

### User Stories

* As a user, I want to be able to take a picture of my refrigerator's contents and ask, "What can I make with this?".
* As a user, I want to speak my ingredients into the app and get recipe ideas back.
* As a user, when I get a recipe suggestion in chat, I want to be able to add the missing ingredients to my shopping list with a single click.
* As a user, I want my conversation history saved so I can refer back to previous suggestions.
* As a user, I want to see the AI's response appear in real-time as it's being generated.

### Backend API Utilization

* `POST /api/transcribe`
* `POST /api/ingest/image`
* `POST /api/chat/ingredients`
* `POST /api/chat` (streaming)
* `POST /api/pantry` (add items from chat)
* `POST /api/events` (track chat interactions)

---

## 6. Page: My Kitchen (Appliance Hub)

### Page Description

A digital inventory of the user's kitchen appliances. This is where users "teach" the app about their specific tools to unlock hyper-personalized cooking instructions.

### Features

* **Appliance Grid**: A visual display of all registered appliances with brand/model info
* **Add Appliance Wizard**: A simple form to add a new appliance by providing its brand, model, and an optional PDF manual
* **Asynchronous Processing UI**: Clear visual feedback (spinners, progress bars, status text) to show that a manual is being uploaded and analyzed by the backend
* **Appliance Detail View**: Shows the AI-extracted information from the manual and allows the user to edit it
* **Processing Queue**: View status of multiple manuals being processed simultaneously
* **Manual Preview**: Option to view the uploaded PDF manual
* **Usage Statistics**: Show how many recipes have been adapted for each appliance
* **Bulk Import**: Option to add multiple appliances at once

### User Stories

* As a user, I want to add my specific air fryer model to the app by uploading its PDF manual, so the app knows its capabilities.
* As a user, I want to see that my manual is being processed and get notified when it's ready.
* As a user, I want to be able to correct any information the AI may have gotten wrong about my appliance.
* As a user, I want to see which of my appliances are most used for recipe adaptation.
* As a user, I want to preview the manual I uploaded to verify it's the correct one.

### Backend API Utilization

* `POST /api/kitchen/appliances`
* `GET /api/kitchen/appliances`
* `DELETE /api/kitchen/appliances/:id`
* `POST /api/events` (track appliance usage)

---

## 7. Page: Recipe Search & Discovery

### Page Description

A powerful search interface that combines full-text search, filtering, and AI-powered discovery to help users find exactly what they're looking for.

### Features

* **Smart Search Bar**: Autocomplete with recent searches and suggestions
* **Advanced Filters**: Cuisine, tags, cooking time, dietary restrictions, difficulty
* **Search Result Grid**: Card-based layout with recipe images, titles, and key info
* **Sort Options**: Relevance, popularity, cooking time, recent additions
* **Save Search**: Bookmark frequently used search criteria
* **Voice Search**: Speak your search query
* **Search History**: Quick access to recent searches
* **Empty State**: Helpful suggestions when no results found

### User Stories

* As a user, I want to search for recipes by ingredient, cuisine, or dietary restriction.
* As a user, I want search suggestions as I type to help me discover recipes.
* As a user, I want to filter results by cooking time so I can find quick meals.
* As a user, I want to save my favorite search combinations for easy access.
* As a user, I want helpful suggestions when my search returns no results.

### Backend API Utilization

* `GET /api/recipes` (with query params)
* `GET /api/search/suggest`
* `POST /api/events` (track search patterns)

---

## 8. Page: Recipe Detail & Cooking Conductor

### Page Description

A redesigned, interactive recipe page focused on making the cooking process itself smooth, organized, and stress-free.

### Features

* **Hero Image**: Large, appetizing photo with overlay controls
* **Recipe Metadata**: Yield, times, difficulty, nutrition (if available)
* **Phased Ingredient Prep**: Ingredients are grouped into collapsible sections based on when they are needed in the recipe
* **Visual Flowchart**: A Mermaid.js diagram that provides a high-level visual overview of the entire cooking workflow, including timings and parallel tasks
* **Appliance Adaptation**: A one-click button to adapt the recipe instructions for any of the user's registered "Smart Kitchen" appliances
* **Printable View**: Generates a clean, printable PDF that includes the phased prep list and the visual flowchart
* **Favorite Toggle**: Quick action to add/remove from favorites
* **Rating & Review**: Rate the recipe and add personal cooking notes
* **Scaling**: Adjust serving size with automatic ingredient calculation
* **Share**: Generate shareable link or export recipe
* **Cooking Mode**: Full-screen, step-by-step view with large text and hands-free navigation
* **Timer Integration**: Built-in timers that can run in background
* **Progress Tracking**: Mark steps as complete with visual checkmarks
* **Ingredient Checklist**: Check off ingredients as you add them

### User Stories

* As a user, I want to see ingredients grouped by what I need to prep first, so I can do all my chopping at once.
* As a user, I want to see a visual map of the recipe steps before I start, so I can understand the timing and workflow.
* As a user, I want to click a button to see exactly how to make this recipe in my specific Tokit Cook Machine, based on the manual I uploaded.
* As a user, I want to rate recipes I've cooked and add my own notes for next time.
* As a user, I want to adjust serving sizes and have ingredient quantities recalculate automatically.
* As a user, I want a cooking mode that keeps my screen on and uses large, easy-to-read text.
* As a user, I want to set timers directly from the recipe steps without leaving the app.

### Backend API Utilization

* `GET /api/recipes/:id`
* `GET /api/recipes/:id/flowchart`
* `POST /api/recipes/:id/tailor` (renamed from adapt)
* `GET /api/recipes/:id/print`
* `POST /api/favorites/:id`
* `DELETE /api/favorites/:id`
* `GET /api/recipes/:id/rating`
* `POST /api/recipes/:id/rating`
* `POST /api/events` (track recipe views, cooking sessions)

---

## 9. Page: Pantry Management

### Page Description

A digital inventory system for tracking ingredients users have on hand, reducing waste and enabling accurate recipe suggestions.

### Features

* **Ingredient List**: Searchable, sortable list of pantry items with quantities
* **Quick Add**: Autocomplete search to add new items rapidly
* **Bulk Entry**: Paste or scan shopping list to add multiple items
* **Categories**: Auto-categorize by produce, proteins, dairy, pantry staples, etc.
* **Expiration Tracking**: Optional expiration dates with visual warnings
* **Low Stock Alerts**: Mark items as running low
* **Usage History**: Track when ingredients are used in recipes
* **Sync with Shopping**: Auto-remove items from pantry when added to recipes
* **Barcode Scanner**: Scan product barcodes to add items (future enhancement)

### User Stories

* As a user, I want to maintain an inventory of my pantry items so recipe suggestions only include things I can actually make.
* As a user, I want to quickly add items I just bought without typing each one manually.
* As a user, I want to know when items are about to expire so I can use them in time.
* As a user, I want the app to automatically remove pantry items when I add them to recipes.
* As a user, I want to categorize my pantry to find items faster.

### Backend API Utilization

* `GET /api/pantry`
* `POST /api/pantry`
* `PUT /api/pantry/:id`
* `DELETE /api/pantry/:id`
* `POST /api/events` (track pantry updates)

---

## 10. Page: Favorites & Collections

### Page Description

A curated space for users to organize their favorite recipes into custom collections, creating their personal cookbook.

### Features

* **Favorites Grid**: All favorited recipes in a card layout
* **Custom Collections**: User-created folders to organize favorites
* **Drag & Drop Organization**: Easy reordering and collection management
* **Collection Sharing**: Generate shareable links for collections
* **Collection Cover**: Auto-generated or custom collection covers
* **Search Within Favorites**: Filter favorites by name, tags, or collection
* **Sort Options**: Recent, alphabetical, rating, cooking time
* **Bulk Actions**: Move multiple recipes between collections
* **Collection Stats**: Number of recipes, average cooking time, cuisines

### User Stories

* As a user, I want to save my favorite recipes for easy access later.
* As a user, I want to organize favorites into collections like "Weeknight Dinners" or "Holiday Recipes."
* As a user, I want to share my collections with family and friends.
* As a user, I want to quickly find a favorite recipe without scrolling through everything.
* As a user, I want to see statistics about my collections.

### Backend API Utilization

* `GET /api/favorites` (new endpoint needed)
* `POST /api/favorites/:id`
* `DELETE /api/favorites/:id`
* `GET /api/recipes` (filtered by favorites)
* `POST /api/events` (track collection usage)

---

## 11. Page: Menu Planning

### Page Description

An intelligent weekly meal planner that helps users organize their cooking schedule, reduce decision fatigue, and streamline shopping.

### Features

* **Weekly Calendar View**: 7-day grid with breakfast, lunch, dinner slots
* **Drag & Drop Planning**: Drag recipes onto calendar slots
* **AI-Generated Menus**: One-click menu generation based on preferences
* **Theme-Based Planning**: Generate menus by theme (Mediterranean week, budget-friendly, etc.)
* **Leftover Management**: Suggestions for using leftovers in upcoming meals
* **Nutrition Overview**: Weekly nutrition summary (calories, macros)
* **Copy Previous Week**: Quickly duplicate successful meal plans
* **Share Menu**: Send weekly plan to family members
* **Print Menu**: Printer-friendly weekly view
* **Recipe Exclusion**: Exclude recently cooked recipes from suggestions

### User Stories

* As a family meal planner, I want to drag and drop recipes onto a weekly calendar.
* As a user, I want the AI to generate a complete week's menu based on my preferences.
* As a user, I want to exclude recipes I've cooked recently from suggestions.
* As a user, I want to see the nutritional summary of my weekly plan.
* As a user, I want to reuse a previous week's menu when it worked well.

### Backend API Utilization

* `POST /api/menus/generate`
* `GET /api/menus/:id`
* `PUT /api/menus/:id`
* `GET /api/menus` (list saved menus - new endpoint needed)
* `POST /api/events` (track menu usage)

---

## 12. Page: Shopping List

### Page Description

An intelligent shopping list generated from menu plans, with pantry-aware deduplication and smart categorization.

### Features

* **Auto-Generated Lists**: Create from menu plans with pantry deduplication
* **Category Organization**: Items grouped by store section (produce, dairy, etc.)
* **Check-Off Interface**: Large touch targets for marking items purchased
* **Manual Add**: Quick-add items not from recipes
* **Store Layout Customization**: Rearrange categories to match your store
* **Share List**: Send list to family members or yourself
* **Multiple Lists**: Separate lists for different stores
* **Price Tracking**: Optional price entry for budgeting (future)
* **Voice Add**: Speak items to add to list
* **Offline Support**: Access and edit lists without connection

### User Stories

* As a user, I want a shopping list automatically generated from my weekly menu that excludes items I already have.
* As a user, I want items organized by store section so I can shop efficiently.
* As a user, I want to check off items as I shop with large, easy-to-tap buttons.
* As a user, I want to add items manually that aren't from recipes.
* As a user, I want to access my shopping list even without internet at the store.

### Backend API Utilization

* `POST /api/menus/:id/shopping-list`
* `GET /api/pantry` (for deduplication)
* Local storage/IndexedDB for offline support

---

## 13. Page: User Settings & Profile

### Page Description

A comprehensive settings page for managing account preferences, app behavior, and data.

### Features

* **Profile Information**: Name, email, avatar
* **Dietary Preferences**: Edit cuisines, allergens, dietary restrictions
* **Notification Settings**: Control email/push notifications
* **Theme Selection**: Light/dark mode, color schemes
* **Measurement Units**: Imperial/metric toggle
* **Language Selection**: Internationalization support (future)
* **Data Management**: Export data, delete account
* **Privacy Settings**: Control data sharing and analytics
* **Default Servings**: Set preferred default serving size
* **Cooking Skill Level**: Adjust recipe complexity suggestions
* **About & Help**: Version info, tutorials, support links

### User Stories

* As a user, I want to update my dietary preferences as they change.
* As a user, I want to choose between light and dark mode for comfortable viewing.
* As a user, I want to toggle between metric and imperial measurements.
* As a user, I want to export my data for backup purposes.
* As a user, I want control over what notifications I receive.

### Backend API Utilization

* `GET /api/prefs`
* `PUT /api/prefs`
* `POST /api/events` (track settings changes)

---

## 14. Page: Recipe Ingestion Tools

### Page Description

Power user tools for importing recipes from external sources, building a comprehensive personal recipe database.

### Features

* **URL Import**: Paste recipe URL to import and normalize
* **Batch Import**: Import multiple URLs at once
* **Image OCR**: Extract recipe from photos of cookbooks or cards
* **Manual Entry**: Full form for creating custom recipes
* **Import Status**: Track progress of batch imports
* **Source Attribution**: Maintain links to original sources
* **Edit After Import**: Refine AI-extracted recipes
* **Import History**: Review previously imported recipes
* **Error Recovery**: Retry failed imports with suggestions

### User Stories

* As a power user, I want to import recipes from my favorite food blogs with one click.
* As a user, I want to import recipes from cookbook photos by taking pictures of the pages.
* As a user, I want to batch-import multiple recipes and track their processing status.
* As a user, I want to create my own custom recipes manually.
* As a user, I want to edit imported recipes to fix any extraction errors.

### Backend API Utilization

* `POST /api/ingest/url`
* `POST /api/recipes/batch-scan`
* `POST /api/ingest/image`
* `POST /api/recipes` (new endpoint for manual creation)
* `PUT /api/recipes/:id` (new endpoint for editing)

---

## 15. Cross-Cutting Concerns

### Progressive Web App (PWA) Features

* **Offline Support**: Cache critical assets and data for offline access
* **Install Prompt**: Ability to install as standalone app on mobile/desktop
* **Background Sync**: Sync changes when connection is restored
* **Push Notifications**: Optional recipe reminders, menu suggestions
* **Service Worker**: Intelligent caching strategy for recipes, images

### Performance Optimization

* **Code Splitting**: Route-based lazy loading of React components
* **Image Optimization**: Automatic resizing and WebP conversion via Cloudflare
* **Edge Caching**: Leverage Cloudflare's CDN for static assets
* **Streaming Responses**: Use SSE for chat and long-running operations
* **Virtual Scrolling**: Efficiently render large recipe lists
* **Prefetching**: Predictive loading of likely-next pages

### Accessibility (WCAG 2.1 AA Compliance)

* **Keyboard Navigation**: Full app navigable without mouse
* **Screen Reader Support**: Proper ARIA labels and semantic HTML
* **Color Contrast**: Meet WCAG AA standards for all text
* **Focus Management**: Clear focus indicators throughout
* **Alternative Text**: All images have descriptive alt text
* **Responsive Text**: Support browser text sizing
* **Error Identification**: Clear, accessible error messages

### Responsive Design

* **Mobile First**: Optimized for phone screens, enhanced for desktop
* **Breakpoints**: Phone (< 640px), Tablet (640-1024px), Desktop (> 1024px)
* **Touch Targets**: Minimum 44x44px for all interactive elements
* **Adaptive Layouts**: Different UX patterns for different screen sizes
* **Orientation Support**: Both portrait and landscape modes

### Security & Privacy

* **Authentication**: Secure user authentication with JWT tokens
* **API Security**: Bearer token authentication for all API calls
* **Data Encryption**: HTTPS for all communications
* **Privacy First**: Minimal data collection, user control over data
* **CORS Configuration**: Proper cross-origin policies
* **Rate Limiting**: Protection against abuse
* **Input Sanitization**: Prevent XSS and injection attacks

### Error Handling & Recovery

* **Graceful Degradation**: Core features work even if some fail
* **Error Boundaries**: React error boundaries to prevent full crashes
* **Retry Logic**: Automatic retry for failed network requests
* **Offline Indicators**: Clear UI feedback when offline
* **Error Tracking**: Structured logging for debugging
* **User-Friendly Messages**: Clear, actionable error messages

### Analytics & Monitoring

* **Event Tracking**: Track key user interactions
* **Performance Monitoring**: Core Web Vitals tracking
* **Error Reporting**: Capture and report runtime errors
* **User Feedback**: In-app feedback mechanism
* **A/B Testing**: Framework for feature experiments
* **Privacy Compliant**: Respect user privacy preferences

---

## 16. Future Enhancements

### Phase 2 Features

* **Social Features**: Share recipes, follow friends, recipe ratings community
* **Meal Prep Mode**: Batch cooking guides with storage instructions
* **Nutrition Tracking**: Detailed nutritional information and goals
* **Recipe Reminders**: Notifications to start prep or preheat oven
* **Voice Commands**: Full voice control while cooking
* **Smart Substitutions**: AI-powered ingredient swap suggestions
* **Recipe Scaling**: Advanced scaling with equipment considerations
* **Cooking Classes**: Video tutorials and guided cooking sessions

### Phase 3 Features

* **Smart Appliance Integration**: Direct control of IoT kitchen devices
* **Grocery Delivery Integration**: One-click purchase from shopping lists
* **Restaurant Mode**: Import menus from favorite restaurants
* **Family Accounts**: Shared meal planning across household
* **Meal Budgeting**: Track food costs and optimize for budget
* **Carbon Footprint**: Sustainability metrics for recipes
* **Seasonal Planning**: AI suggests recipes based on local seasonal produce
* **Recipe Remixing**: AI-generated variations of favorite recipes

---

## 17. Technical Architecture

### Frontend Stack

* **Framework**: React 18+ with TypeScript
* **Build Tool**: Vite with Cloudflare Vite Plugin
* **UI Library**: shadcn/ui components
* **Styling**: Tailwind CSS
* **State Management**: 
  - Zustand for global client state
  - TanStack Query for server state
* **Routing**: React Router v6 (client-side only, no SSR)
* **Forms**: React Hook Form with Zod validation
* **Charts**: Recharts for data visualization
* **PWA**: Workbox for service worker management

### Backend Integration

* **API Communication**: Custom fetch wrapper with auth tokens
* **Real-time**: Server-Sent Events (SSE) for streaming chat
* **File Upload**: multipart/form-data for images and PDFs
* **Caching**: TanStack Query for request deduplication and caching
* **Offline**: IndexedDB for offline data persistence

### Cloudflare Workers Configuration

```jsonc
{
  "name": "menuforge-app",
  "compatibility_date": "2025-04-03",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "main": "./worker/index.ts"
}
```

### Development Workflow

* **Local Development**: `npm run dev` (Vite + Cloudflare runtime)
* **Testing**: Vitest for unit tests, Playwright for E2E
* **Linting**: ESLint + Prettier
* **Type Checking**: TypeScript strict mode
* **Git Hooks**: Husky for pre-commit checks
* **CI/CD**: GitHub Actions with Cloudflare Workers deploy

---

## 18. Success Metrics

### User Engagement

* Daily Active Users (DAU)
* Session duration
* Recipes viewed per session
* Chat interactions per week
* Return visit rate

### Feature Adoption

* % users who complete onboarding
* % users with registered appliances
* % users using menu planning
* % users with pantry items tracked
* Favorite recipe count per user

### User Satisfaction

* App store ratings
* NPS (Net Promoter Score)
* Feature satisfaction surveys
* Support ticket volume
* User retention (30-day, 90-day)

### Technical Performance

* Core Web Vitals (LCP, FID, CLS)
* API response times (p50, p95, p99)
* Error rate < 1%
* Uptime > 99.9%
* Offline capability usage

---

## 19. Release Plan

### MVP (v1.0) - Core Features

* User onboarding & profile
* Dashboard with personalized recipes
* AI chat with text input
* Recipe search & detail pages
* Favorites
* Basic appliance management
* Recipe flowchart visualization

### v1.1 - Enhanced Discovery

* Voice input for chat
* Image ingestion
* Pantry management
* Advanced search filters
* Recipe rating & reviews

### v1.2 - Planning & Organization

* Menu planning
* Smart shopping lists
* Recipe collections
* Batch recipe import
* Appliance adaptation

### v1.3 - Cooking Experience

* Cooking mode
* Built-in timers
* Progress tracking
* Recipe scaling
* Printable recipes

### v2.0 - PWA & Offline

* Full PWA support
* Offline recipe access
* Background sync
* Push notifications
* Install prompts
