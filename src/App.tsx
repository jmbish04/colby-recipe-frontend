import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { BookOpen, CalendarRange, CookingPot, MessageSquareText } from 'lucide-react'

import { AppShell, type AppNavItem } from '@/components/layout/app-shell'

const ChatRoute = lazy(() => import('@/routes/chat'))
const KitchenHubRoute = lazy(() => import('@/routes/kitchen-hub'))
const RecipesRoute = lazy(() => import('@/routes/recipes'))
const RecipeDetailRoute = lazy(() => import('@/routes/recipes/detail'))
const PlannerRoute = lazy(() => import('@/routes/planner'))
const NotFoundRoute = lazy(() => import('@/routes/not-found'))

const navItems: AppNavItem[] = [
  {
    key: 'kitchen',
    to: '/kitchen',
    label: 'Kitchen hub',
    description: 'Coordinate appliances and pantry sync',
    icon: <CookingPot className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: 'chat',
    to: '/chat',
    label: 'Chat',
    description: 'AI sous chef and appliance insights',
    icon: <MessageSquareText className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: 'recipes',
    to: '/recipes',
    label: 'Recipes',
    description: 'Browse appliance-optimized recipes',
    icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: 'planner',
    to: '/planner',
    label: 'Planner',
    description: 'Plan the week and sync groceries',
    icon: <CalendarRange className="h-4 w-4" aria-hidden="true" />,
  },
]

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell navItems={navItems} />}>
        <Route index element={<Navigate to="/kitchen" replace />} />
        <Route path="chat" element={<ChatRoute />} />
        <Route path="kitchen" element={<KitchenHubRoute />} />
        <Route path="recipes" element={<RecipesRoute />} />
        <Route path="recipes/:id" element={<RecipeDetailRoute />} />
        <Route path="planner" element={<PlannerRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  )
}
