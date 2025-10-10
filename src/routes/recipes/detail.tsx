import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Sparkles, UtensilsCrossed } from 'lucide-react'

import { RecipeEditorDialog } from '@/components/recipes/recipe-editor-dialog'
import { MermaidDiagram } from '@/components/recipes/mermaid-diagram'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDeleteRecipeMutation,
  useRecipeFlowchart,
  useRecipeDetail,
  useTailoredRecipe,
  useUpdateRecipeMutation,
  type RecipePayload,
} from '@/hooks/useRecipes'
import { useAppliancesQuery } from '@/hooks/useAppliances'
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
  const flowchartQuery = useRecipeFlowchart(recipeId)
  const appliancesQuery = useAppliancesQuery()
  const readyAppliances = useMemo(
    () => (appliancesQuery.data ?? []).filter((appliance) => appliance.status === 'ready'),
    [appliancesQuery.data],
  )
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([])
  const tailored = useTailoredRecipe({ recipeId, applianceIds: selectedAppliances })
  const tailoredData = tailored.data
  const [instructionView, setInstructionView] = useState<'original' | 'tailored'>('original')

  useEffect(() => {
    setSelectedAppliances((current) => {
      if (readyAppliances.length === 0) {
        return []
      }

      const availableIds = readyAppliances.map((appliance) => appliance.id)
      const filtered = current.filter((id) => availableIds.includes(id))

      if (filtered.length > 0) {
        return filtered
      }

      return availableIds
    })
  }, [readyAppliances])

  useEffect(() => {
    if (tailoredData && tailoredData.status === 'complete' && tailoredData.blocks.length > 0) {
      setInstructionView('tailored')
    }
  }, [tailoredData])

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

  const toggleApplianceSelection = (applianceId: string) => {
    setSelectedAppliances((current) =>
      current.includes(applianceId)
        ? current.filter((id) => id !== applianceId)
        : [...current, applianceId],
    )
  }

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
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
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
              <CardDescription>
                Steps are orchestrated across connected appliances in guided cook mode. Tailor them to match your
                setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-foreground">Select appliances for tailoring</p>
                  {appliancesQuery.isFetching && (
                    <Badge variant="outline" className="text-xs">
                      Refreshing
                    </Badge>
                  )}
                </div>
                {appliancesQuery.isError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    We couldn&apos;t load your appliances. Tailoring may be limited until the hub reconnects.
                  </p>
                )}
                {appliancesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading connected appliances…</p>
                ) : readyAppliances.length === 0 ? (
                  <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Connect a ready appliance in the Smart Kitchen Hub to personalize steps.
                  </p>
                ) : (
                  <div
                    role="group"
                    aria-label="Appliances available for tailoring"
                    className="flex flex-wrap gap-2"
                  >
                    {readyAppliances.map((appliance) => {
                      const label = appliance.nickname ?? `${appliance.brand} ${appliance.model}`
                      const isSelected = selectedAppliances.includes(appliance.id)
                      return (
                        <Button
                          key={appliance.id}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleApplianceSelection(appliance.id)}
                          aria-pressed={isSelected}
                          className="min-w-[120px] justify-center"
                        >
                          {label}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => tailored.startTailoring()}
                  disabled={selectedAppliances.length === 0 || tailored.isPending || tailored.isStreaming}
                >
                  {tailored.isStreaming ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Tailor for my kitchen
                </Button>
                <Button variant="outline" onClick={tailored.cancel} disabled={!tailored.isStreaming}>
                  Cancel
                </Button>
                {tailored.statusMessage && (
                  <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
                    {tailored.statusMessage}
                  </span>
                )}
              </div>
              <span className="sr-only" role="status" aria-live="assertive">
                {tailored.statusMessage ?? ''}
              </span>

              <Tabs
                value={instructionView}
                onValueChange={(value) => setInstructionView(value as 'original' | 'tailored')}
                className="space-y-4"
              >
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="original">Original plan</TabsTrigger>
                  <TabsTrigger
                    value="tailored"
                    disabled={!tailoredData || tailoredData.blocks.length === 0}
                  >
                    Tailored plan
                    {tailored.isStreaming && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Live
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="original">
                  <ol className="list-decimal space-y-3 pl-6 text-sm">
                    {recipe.instructions.map((step, index) => (
                      <li key={`${index}-${step}`}>{step}</li>
                    ))}
                  </ol>
                </TabsContent>
                <TabsContent value="tailored">
                  {tailored.isStreaming && (
                    <div
                      className="mb-4 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
                      role="status"
                      aria-live="assertive"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Streaming personalized steps…
                    </div>
                  )}
                  {tailoredData?.status === 'error' ? (
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        {tailoredData.errorMessage ?? 'We were unable to tailor this recipe for your kitchen.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => tailored.startTailoring()}
                          disabled={tailored.isPending || tailored.isStreaming}
                        >
                          Retry tailoring
                        </Button>
                      </div>
                    </div>
                  ) : tailoredData?.blocks.length ? (
                    <ol className="list-decimal space-y-4 pl-6 text-sm">
                      {tailoredData.blocks.map((block) => (
                        <li key={block.id} className="space-y-1.5">
                          <div className="font-medium text-foreground">{block.title}</div>
                          <p className="text-muted-foreground">{block.content}</p>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
                            Optimized for {block.applianceContext}
                            {block.durationMinutes ? ` • ${block.durationMinutes} min` : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tailored instructions will appear here once generated for your selected appliances.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="workflow">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Workflow orchestration</CardTitle>
                  <CardDescription>
                    Visualize how this recipe coordinates timing, appliances, and prep windows.
                  </CardDescription>
                </div>
                {flowchartQuery.isFetching && (
                  <Badge variant="outline" className="text-xs">
                    Refreshing
                  </Badge>
                )}
              </div>
              {flowchartQuery.data?.recommendedAppliances?.length ? (
                <div className="flex flex-wrap gap-2 text-xs" aria-label="Recommended starting appliances">
                  {flowchartQuery.data.recommendedAppliances.map((appliance) => (
                    <Badge key={appliance} variant="secondary">
                      {appliance}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {flowchartQuery.isLoading || flowchartQuery.isPending ? (
                <Skeleton className="h-[320px] w-full rounded-2xl" />
              ) : flowchartQuery.isError || !flowchartQuery.data ? (
                <div className="space-y-3 text-sm text-muted-foreground" role="alert">
                  <p>We couldn&apos;t load the workflow diagram. Try again shortly.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => flowchartQuery.refetch()}
                    disabled={flowchartQuery.isFetching}
                  >
                    {flowchartQuery.isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{flowchartQuery.data.summary}</p>
                  <MermaidDiagram
                    definition={flowchartQuery.data.mermaid}
                    summary={flowchartQuery.data.summary}
                    className="min-h-[320px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(flowchartQuery.data.updatedAt).toLocaleString()}
                  </p>
                </>
              )}
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
