import { Clock3, Flame, Utensils } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

export type Recipe = {
  id: string
  title: string
  summary: string
  cookTime: string
  servings: number
  tags: string[]
  completion: number
}

interface RecipeCardProps {
  recipe: Recipe
  onCook?: (recipe: Recipe) => void
}

export function RecipeCard({ recipe, onCook }: RecipeCardProps) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{recipe.title}</CardTitle>
            <CardDescription>{recipe.summary}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-4 w-4" />
              {recipe.cookTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <Utensils className="h-4 w-4" />
              {recipe.servings} servings
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant={tag === 'sous-vide' ? 'secondary' : 'muted'}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-foreground">
              <Flame className="h-4 w-4 text-primary" />
              Session progress
            </span>
            <span>{Math.round(recipe.completion)}%</span>
          </div>
          <Progress value={recipe.completion} />
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Save this recipe to your menu plan to automatically sync ingredients with your pantry inventory.
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Optimized for smart appliance workflows.</div>
        <Button onClick={() => onCook?.(recipe)}>Start cooking</Button>
      </CardFooter>
    </Card>
  )
}
