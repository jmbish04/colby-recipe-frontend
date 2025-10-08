import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, UtensilsCrossed } from 'lucide-react'

import { RecipeEditorDialog } from '@/components/recipes/recipe-editor-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDeleteRecipeMutation,
  useRecipeDetail,
  useUpdateRecipeMutation,
  type RecipePayload,
} from '@/hooks/useRecipes'
import { showWarningToast } from '@/lib/toast'

export default function RecipeDetailRoute() {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipeId = params.id ?? ''
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

  const recipeQuery = useRecipeDetail(recipeId)
  const updateRecipe = useUpdateRecipeMutation()
  const deleteRecipe = useDeleteRecipeMutation()

  const recipe = recipeQuery.data

  const metaItems = useMemo(() => {
    if (!recipe) return []
    return [
      { label: 'Cuisine', value: recipe.cuisine },
      { label: 'Difficulty', value: capitalize(recipe.difficulty) },
      { label: 'Total time', value: `${recipe.totalMinutes} minutes` },
      { label: 'Servings', value: recipe.servings.toString() },
      { label: 'Last updated', value: new Date(recipe.updatedAt).toLocaleString() },
    ]
  }, [recipe])

  const handleUpdate = (payload: RecipePayload) => {
    updateRecipe.mutate(
      { id: recipeId, data: payload },
      {
        onSuccess: () => setIsEditOpen(false),
      },
    )
  }

  const handleDelete = () => {
    if (!recipeId) return
    deleteRecipe.mutate(
      { id: recipeId },
      {
        onSuccess: () => {
          setIsDeleteConfirming(false)
          navigate('/recipes')
        },
      },
    )
  }

  if (recipeQuery.isLoading) {
    return (
      <section className="space-y-8" aria-busy="true">
        <Skeleton className="h-6 w-24" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-[360px] w-full rounded-2xl" />
          <Skeleton className="h-[360px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </section>
    )
  }

  if (recipeQuery.isError || !recipe) {
    return (
      <section className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/recipes" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to recipes
          </Link>
        </Button>
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Recipe unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load this recipe. It may have been removed or is temporarily inaccessible.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  const handleDeleteClick = () => {
    setIsDeleteConfirming(true)
    showWarningToast('Confirm delete below to remove this recipe from the catalog.')
  }

  return (
    <section className="space-y-10" aria-labelledby="recipe-detail-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" asChild>
          <Link to="/recipes" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to recipes
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteClick} disabled={deleteRecipe.isPending}>
            {deleteRecipe.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Remove
          </Button>
          <Button onClick={() => setIsEditOpen(true)} disabled={updateRecipe.isPending}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit
          </Button>
        </div>
      </div>

      <header className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <img
              src={recipe.thumbnailUrl}
              alt={recipe.title}
              className="h-80 w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="space-y-2">
            <h1 id="recipe-detail-heading" className="text-3xl font-semibold tracking-tight">
              {recipe.title}
            </h1>
            <p className="text-muted-foreground">{recipe.summary}</p>
            <div className="flex flex-wrap gap-2" aria-label="Recipe tags">
              {recipe.tags.length === 0 ? (
                <Badge variant="outline">Untagged</Badge>
              ) : (
                recipe.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </article>
        <aside>
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UtensilsCrossed className="h-4 w-4" aria-hidden="true" /> Recipe overview
              </CardTitle>
              <CardDescription>Syncs automatically with planner and appliance pairings.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                {metaItems.map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="text-right font-medium text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </header>

      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>
        <TabsContent value="ingredients">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Ingredients</CardTitle>
              <CardDescription>Optimized for pantry sync and shopping list exports.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-6 text-sm">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="instructions">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
              <CardDescription>Steps are orchestrated across connected appliances in guided cook mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-3 pl-6 text-sm">
                {recipe.instructions.map((step, index) => (
                  <li key={`${index}-${step}`}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="equipment">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Equipment</CardTitle>
              <CardDescription>Ensure each station has the correct tools staged.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-6 text-sm">
                {recipe.equipment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecipeEditorDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={(open) => setIsEditOpen(open)}
        onSubmit={handleUpdate}
        isSubmitting={updateRecipe.isPending}
        initialRecipe={recipe}
      />

      {isDeleteConfirming && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-base">Confirm deletion</CardTitle>
            <CardDescription>
              Deleting this recipe removes it from the catalog. This action can&apos;t be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setIsDeleteConfirming(false)} disabled={deleteRecipe.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRecipe.isPending}>
              {deleteRecipe.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete permanently
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
