import { CalendarDays, Clock3, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useRouteData } from '@/lib/routeData'

export default function PlannerRoute() {
  const { data } = useRouteData('planner')

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Weekly planner</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Drag-and-drop scheduling, pantry-aware menus, and automatic grocery sync. The planner keeps your entire culinary week
            orchestrated.
          </p>
        </div>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New plan
        </Button>
      </header>

      <Card className="border border-border/70 bg-background/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Upcoming sessions</CardTitle>
            <CardDescription>Preview the next cooks across your connected appliances.</CardDescription>
          </div>
          <Badge variant="secondary">Auto-synced</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.upcomingMeals.map((meal) => (
            <div
              key={meal.id}
              className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-4 shadow-sm transition hover:border-primary/60"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{meal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {meal.day}
                  </div>
                </div>
                <Badge variant="outline">{meal.appliances.length} devices</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {meal.time}
              </div>
              <p className="text-xs text-muted-foreground">
                Optimized for {meal.appliances.join(', ')} workflows.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-dashed border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>Suggested automations</CardTitle>
          <CardDescription>Jumpstart popular flows powered by the MenuForge AI planner.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {data.suggestions.map((suggestion) => (
            <div key={suggestion.title} className="space-y-2 rounded-lg border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              <Button size="sm" variant="secondary">
                Queue automation
              </Button>
            </div>
          ))}
        </CardContent>
        <Separator />
        <p className="px-6 pb-6 text-xs text-muted-foreground">
          TanStack Query prefetch keeps these suggestions ready when hopping over from the chat assistant.
        </p>
      </Card>
    </section>
  )
}
