import { CheckCircle2, CircleDashed, ShoppingBag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type Ingredient = {
  name: string
  quantity: string
  pantryStatus: 'available' | 'low' | 'missing'
}

interface IngredientListProps {
  items: Ingredient[]
}

const statusCopy: Record<Ingredient['pantryStatus'], { label: string; tone: 'default' | 'muted' | 'secondary' }> = {
  available: { label: 'In pantry', tone: 'secondary' },
  low: { label: 'Low stock', tone: 'default' },
  missing: { label: 'Add to cart', tone: 'muted' },
}

const statusIcon: Record<Ingredient['pantryStatus'], JSX.Element> = {
  available: <CheckCircle2 className="h-4 w-4 text-primary" />,
  low: <CircleDashed className="h-4 w-4 text-accent" />,
  missing: <ShoppingBag className="h-4 w-4 text-destructive" />,
}

export function IngredientList({ items }: IngredientListProps) {
  return (
    <Card className="border-dashed border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle>Ingredient readiness</CardTitle>
        <CardDescription>Pantry-aware breakdown synced with your shopping list.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((ingredient) => {
          const status = statusCopy[ingredient.pantryStatus]

          return (
            <div
              key={ingredient.name}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {statusIcon[ingredient.pantryStatus]}
                  {ingredient.name}
                </div>
                <p className="text-xs text-muted-foreground">{ingredient.quantity}</p>
              </div>
              <Badge variant={status.tone}>{status.label}</Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
