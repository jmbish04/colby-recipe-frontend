import { ArrowRight, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useRouteData } from '@/lib/routeData'

export default function RecipesRoute() {
  const { data } = useRouteData('recipes')

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Recipe intelligence</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Discover the dishes your appliances love. Tailored insights pair each recipe with the ideal device workflow and cook
            confidence.
          </p>
        </div>
        <Button>
          Explore recipe library
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.featured.map((recipe) => (
          <Card key={recipe.id} className="border border-border/70 bg-background/60">
            <CardHeader className="space-y-2">
              <CardTitle>{recipe.title}</CardTitle>
              <CardDescription>{recipe.summary}</CardDescription>
              <div className="flex flex-wrap gap-2">
                {recipe.badges.map((badge) => (
                  <Badge key={badge} variant="outline">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button size="sm" variant="secondary">
                Load in workspace
              </Button>
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-dashed border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>Program health</CardTitle>
          <CardDescription>Signals from Query insights to help you prioritize content refresh.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {data.insights.map((item) => (
            <div key={item.label} className="space-y-1 rounded-lg border border-border/60 bg-background/40 p-4">
              <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </CardContent>
        <Separator />
        <p className="px-6 pb-6 text-xs text-muted-foreground">
          Data is prefetched using TanStack Query when navigating from planner and chat surfaces to keep the recipe gallery snappy.
        </p>
      </Card>
    </section>
  )
}
