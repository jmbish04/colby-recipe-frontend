import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { RecipeEditorDialog } from '@/components/recipes/recipe-editor-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreateRecipeMutation,
  useDeleteRecipeMutation,
  useRecipeDetail,
  useRecipes,
  useUpdateRecipeMutation,
  type RecipeDifficulty,
  type RecipePayload,
  type RecipeSummary,
} from '@/hooks/useRecipes'

const difficultyLabels: Record<RecipeDifficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  advanced: 'Advanced',
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remaining} min`
}

export default function RecipesRoute() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | undefined>(undefined)
  const [tagFilter, setTagFilter] = useState<string>('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveSearch(searchTerm.trim())
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchTerm])

  const recipesQuery = useRecipes(
    useMemo(
      () => ({
        search: activeSearch || undefined,
        difficulty,
        tag: tagFilter || undefined,
      }),
      [activeSearch, difficulty, tagFilter],
    ),
  )

  const createRecipe = useCreateRecipeMutation()
  const updateRecipe = useUpdateRecipeMutation()
  const deleteRecipe = useDeleteRecipeMutation()

  const editingRecipeQuery = useRecipeDetail(editingId ?? undefined)
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data])

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const handleCreateSubmit = (payload: RecipePayload) => {
    createRecipe.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false)
      },
    })
  }

  const handleUpdateSubmit = (payload: RecipePayload) => {
    if (!editingId) return

    updateRecipe.mutate(
      { id: editingId, data: payload },
      {
        onSuccess: () => {
          setEditingId(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTargetId) return
    deleteRecipe.mutate(
      { id: deleteTargetId },
      {
        onSuccess: () => {
          setDeleteTargetId(null)
        },
      },
    )
  }

  const handleClearFilters = () => {
    setDifficulty(undefined)
    setTagFilter('')
    setSearchTerm('')
    setActiveSearch('')
  }

  const isLoading = recipesQuery.isLoading
  const isFetching = recipesQuery.isFetching

  return (
    <section className="space-y-10" aria-labelledby="recipes-heading">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 id="recipes-heading" className="text-3xl font-semibold tracking-tight">
              Recipe intelligence
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Curate recipes optimized for connected appliances. Quickly adapt metadata, ingredients, and guided instructions
              with optimistic updates.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New recipe
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search recipes, tags, or cuisines"
              type="search"
              className="pl-9"
              aria-label="Search recipes"
            />
          </label>
          <Select
            value={difficulty ?? 'all'}
            onValueChange={(value) => setDifficulty(value === 'all' ? undefined : (value as RecipeDifficulty))}
          >
            <SelectTrigger aria-label="Filter by difficulty">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tagFilter || 'all'} onValueChange={(value) => setTagFilter(value === 'all' ? '' : value)}>
            <SelectTrigger aria-label="Filter by tag">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {recipes.length === 0 && !isLoading
              ? 'No recipes match the current filters.'
              : `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} loaded`}
          </span>
          {(difficulty || tagFilter || activeSearch) && (
            <Button variant="link" className="h-auto p-0 text-xs" onClick={handleClearFilters}>
              Clear filters
            </Button>
          )}
          {isFetching && (
            <span className="flex items-center gap-1" aria-live="polite">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Refreshing
            </span>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-border/60 bg-card/60">
              <CardHeader className="space-y-2">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => setEditingId(recipe.id)}
              onDelete={() => setDeleteTargetId(recipe.id)}
            />
          ))}
        </div>
      )}

      <RecipeEditorDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={(open) => setIsCreateOpen(open)}
        onSubmit={handleCreateSubmit}
        isSubmitting={createRecipe.isPending}
      />

      <RecipeEditorDialog
        mode="edit"
        open={Boolean(editingId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
          }
        }}
        onSubmit={handleUpdateSubmit}
        isSubmitting={updateRecipe.isPending}
        initialRecipe={editingRecipeQuery.data}
      />

      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => (!open ? setDeleteTargetId(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recipe? This removes it from the recipe intelligence surfaces until recreated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRecipe.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteRecipe.isPending}>
              {deleteRecipe.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

interface RecipeCardProps {
  recipe: RecipeSummary
  onEdit: () => void
  onDelete: () => void
}

function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <Card role="listitem" className="flex h-full flex-col border-border/60 bg-card/60">
      <CardHeader className="space-y-3">
        <figure className="overflow-hidden rounded-xl border border-border/40">
          <img
            src={recipe.thumbnailUrl}
            alt={recipe.title}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </figure>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-foreground">{recipe.title}</CardTitle>
          <CardDescription>{recipe.summary}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">Cuisine</dt>
            <dd>{recipe.cuisine}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Difficulty</dt>
            <dd>{difficultyLabels[recipe.difficulty]}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Total time</dt>
            <dd>{formatMinutes(recipe.totalMinutes)}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Servings</dt>
            <dd>{recipe.servings}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2" aria-label="Recipe tags">
          {recipe.tags.length === 0 ? (
            <Badge variant="outline" className="text-xs">
              Untagged
            </Badge>
          ) : (
            recipe.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link to={`/recipes/${recipe.id}`} aria-label={`View ${recipe.title}`}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> View
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} aria-label={`Edit ${recipe.title}`}>
          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${recipe.title}`}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
