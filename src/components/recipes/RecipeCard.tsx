import {
  useMemo,
  useState,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
} from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BookmarkCheck, ChefHat, Clock3, Flame } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { useApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

export type RecipeDifficulty = 'easy' | 'moderate' | 'advanced'

export interface RecipeIngredientItem {
  id: string
  name: string
  quantity?: string
  note?: string
}

export interface RecipeIngredientSection {
  id: string
  title: string
  items: RecipeIngredientItem[]
}

export interface GenerativeRecipeData {
  id: string
  title: string
  description: string
  cuisine?: string
  tags: string[]
  totalMinutes?: number
  difficulty?: RecipeDifficulty
  servings?: number
  heroImageUrl?: string
  instructions: string
  ingredients: RecipeIngredientSection[]
}

interface RecipeCardProps {
  recipe: GenerativeRecipeData
  className?: string
}

type ShoppingListItemInput = {
  id: string
  name: string
  quantity?: string
  note?: string
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const navigate = useNavigate()
  const api = useApi()
  const [optimisticIds, setOptimisticIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const ids = recipe.ingredients.flatMap((section) => section.items.map((item) => item.id))
    return new Set(ids)
  })

  const selectedItems = useMemo(() => {
    const sections = recipe.ingredients
    const items: RecipeIngredientItem[] = []

    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (selectedIds.has(item.id)) {
          items.push(item)
        }
      })
    })

    return items
  }, [recipe.ingredients, selectedIds])

  const hasSelection = selectedItems.length > 0

  const addIngredientsMutation = useMutation({
    mutationFn: async (items: ShoppingListItemInput[]) =>
      api.post<{ ok: true; added: ShoppingListItemInput[] }>('/api/shopping-list', {
        body: { items },
      }),
    onMutate: async (items) => {
      setOptimisticIds(items.map((item) => item.id))
      showInfoToast('Syncing ingredients to your shopping list…')
    },
    onError: (error) => {
      setOptimisticIds([])
      showErrorToast(error.message)
    },
    onSuccess: (response) => {
      const count = response.added.length
      showSuccessToast(`Added ${count} ingredient${count === 1 ? '' : 's'} to your shopping list`)
    },
    onSettled: () => {
      setOptimisticIds([])
    },
  })

  const handleNavigation = () => {
    navigate(`/recipes/${recipe.id}`)
  }

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNavigation()
    }
  }

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      return next
    })
  }

  const handleAddToShoppingList: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    if (!hasSelection) {
      showInfoToast('Select at least one ingredient to sync to your list')
      return
    }

    const payload = selectedItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      note: item.note,
    }))

    addIngredientsMutation.mutate(payload)
  }

  const renderHero = () => {
    if (!recipe.heroImageUrl) {
      return null
    }

    return (
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={recipe.heroImageUrl}
          alt=""
          className="h-40 w-full rounded-lg object-cover"
          loading="lazy"
        />
        <span className="sr-only">{`${recipe.title} hero image`}</span>
      </div>
    )
  }

  const isPending = addIngredientsMutation.isPending
  const isOptimistic = optimisticIds.length > 0

  const stopPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleNavigation}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative border-primary/40 bg-primary/5 text-left shadow-lg transition hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary/80">
              <ChefHat className="h-4 w-4" aria-hidden="true" />
              <span>{recipe.cuisine ?? 'Chef curated inspiration'}</span>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">{recipe.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {typeof recipe.totalMinutes === 'number' && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {recipe.totalMinutes} min total
                </span>
              )}
              {recipe.difficulty && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)} intensity
                </span>
              )}
              {typeof recipe.servings === 'number' && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Serves {recipe.servings}
                </span>
              )}
            </div>
          </div>
          {renderHero()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</h3>
          <Accordion
            type="multiple"
            className="mt-3 space-y-2"
            onClick={stopPropagation}
            defaultValue={recipe.ingredients.map((section) => section.id)}
          >
            {recipe.ingredients.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="overflow-hidden rounded-lg border border-border/70 bg-background/70"
              >
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold" onClick={stopPropagation}>
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 px-4 pb-4 pt-2">
                  {section.items.map((item) => {
                    const isChecked = selectedIds.has(item.id)
                    const isSyncing = optimisticIds.includes(item.id)

                    return (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 rounded-md border border-transparent p-2 text-sm transition',
                          isSyncing ? 'border-primary/40 bg-primary/10' : 'hover:border-border/80 hover:bg-background/80',
                        )}
                        onClick={stopPropagation}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleIngredient(item.id)}
                          onClick={stopPropagation}
                          aria-label={`Toggle ${item.name}`}
                        />
                        <span className="flex-1 space-y-1 text-muted-foreground">
                          <span className="block text-foreground">{item.name}</span>
                          {item.quantity ? <span className="block text-xs">{item.quantity}</span> : null}
                          {item.note ? (
                            <span className="block text-xs italic text-muted-foreground/80">{item.note}</span>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Instructions</h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ReactMarkdown
              components={{
                p: (props) => <p {...props} className="text-foreground/90" />,
                ol: (props) => (
                  <ol
                    {...props}
                    className="list-decimal space-y-2 pl-5 text-foreground/90 marker:text-primary"
                  />
                ),
                ul: (props) => (
                  <ul
                    {...props}
                    className="list-disc space-y-2 pl-5 text-foreground/90 marker:text-primary"
                  />
                ),
                li: (props) => <li {...props} className="pl-1" />,
                strong: (props) => <strong {...props} className="font-semibold text-foreground" />,
              }}
            >
              {recipe.instructions}
            </ReactMarkdown>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-background/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
          {isPending && <span className="text-primary">Syncing selected ingredients…</span>}
          {!isPending && isOptimistic && <span className="text-primary">Ingredients synced!</span>}
          {!isPending && !isOptimistic && (
            <span>Select the ingredients you want to add to your shopping list.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              handleNavigation()
            }}
          >
            View full recipe
          </Button>
          <Button
            disabled={!hasSelection || isPending}
            onClick={handleAddToShoppingList}
          >
            {isPending ? 'Adding…' : `Add ${selectedItems.length} ingredient${selectedItems.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
