import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import type { RecipeDetail, RecipePayload } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const recipeFormSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title must be 120 characters or less'),
    summary: z
      .string()
      .min(10, 'Summary must be at least 10 characters')
      .max(320, 'Summary must be 320 characters or less'),
    cuisine: z
      .string()
      .min(2, 'Cuisine must be at least 2 characters')
      .max(60, 'Cuisine must be 60 characters or less'),
    difficulty: z.enum(['easy', 'moderate', 'advanced']),
    totalMinutes: z
      .coerce.number()
      .int('Total time must be an integer number of minutes')
      .min(1, 'Total time must be at least 1 minute')
      .max(720, 'Total time must be 720 minutes or less'),
    servings: z
      .coerce.number()
      .int('Servings must be an integer')
      .min(1, 'Servings must be at least 1')
      .max(24, 'Servings must be 24 or fewer'),
    tags: z.string().max(200, 'Tags must be 200 characters or less').optional().default(''),
    thumbnailUrl: z.string().url('Enter a valid image URL'),
    ingredients: z.string().min(1, 'Add at least one ingredient'),
    instructions: z.string().min(1, 'Add at least one instruction'),
    equipment: z.string().min(1, 'Add at least one equipment item'),
  })
  .superRefine((values, ctx) => {
    const ingredientList = parseMultiline(values.ingredients)
    const instructionList = parseMultiline(values.instructions)
    const equipmentList = parseMultiline(values.equipment)
    const tags = parseTags(values.tags ?? '')

    if (ingredientList.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one ingredient', path: ['ingredients'] })
    }

    if (instructionList.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one instruction', path: ['instructions'] })
    }

    if (equipmentList.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one equipment item', path: ['equipment'] })
    }

    if (tags.length > 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide up to 8 tags', path: ['tags'] })
    }

    if (tags.some((tag) => tag.length > 24)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tags must be 24 characters or less', path: ['tags'] })
    }
  })

type RecipeFormValues = z.infer<typeof recipeFormSchema>

function parseMultiline(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => tag.toLowerCase())
}

function buildFormDefaults(recipe?: RecipeDetail): RecipeFormValues {
  if (!recipe) {
    return {
      title: '',
      summary: '',
      cuisine: '',
      difficulty: 'moderate',
      totalMinutes: 30,
      servings: 4,
      tags: '',
      thumbnailUrl: '',
      ingredients: '',
      instructions: '',
      equipment: '',
    }
  }

  return {
    title: recipe.title,
    summary: recipe.summary,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    totalMinutes: recipe.totalMinutes,
    servings: recipe.servings,
    tags: recipe.tags.join(', '),
    thumbnailUrl: recipe.thumbnailUrl,
    ingredients: recipe.ingredients.join('\n'),
    instructions: recipe.instructions.join('\n'),
    equipment: recipe.equipment.join('\n'),
  }
}

function buildPayload(values: RecipeFormValues): RecipePayload {
  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    cuisine: values.cuisine.trim(),
    difficulty: values.difficulty,
    totalMinutes: values.totalMinutes,
    servings: values.servings,
    tags: parseTags(values.tags ?? ''),
    thumbnailUrl: values.thumbnailUrl.trim(),
    ingredients: parseMultiline(values.ingredients),
    instructions: parseMultiline(values.instructions),
    equipment: parseMultiline(values.equipment),
  }
}

export interface RecipeEditorDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: RecipePayload) => void
  isSubmitting?: boolean
  initialRecipe?: RecipeDetail
}

export function RecipeEditorDialog({
  mode,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialRecipe,
}: RecipeEditorDialogProps) {
  const defaultValues = useMemo(() => buildFormDefaults(initialRecipe), [initialRecipe])

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema) as Resolver<RecipeFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(buildFormDefaults(initialRecipe))
    }
  }, [form, initialRecipe, open])

  const isLoadingRecipe = mode === 'edit' && !initialRecipe

  const handleSubmit = form.handleSubmit((values: RecipeFormValues) => {
    onSubmit(buildPayload(values))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[min(90vh,800px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create recipe' : 'Edit recipe'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define a new recipe to orchestrate appliances and workflows across the kitchen hub.'
              : 'Update recipe metadata and steps. Changes are shared instantly across connected modules.'}
          </DialogDescription>
        </DialogHeader>
        {isLoadingRecipe ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading recipe details…
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Precision steam focaccia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="High hydration bake tailored for steam ovens." {...field} />
                    </FormControl>
                    <FormDescription>Share what makes this recipe shine for connected appliances.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuisine</FormLabel>
                    <FormControl>
                      <Input placeholder="Italian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total time (minutes)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servings</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="steam, bread, vegetarian" {...field} />
                    </FormControl>
                    <FormDescription>Separate tags with commas. Used for search and filtering.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://images.unsplash.com/..." type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={'500g bread flour\n410g water\n15g fine sea salt'}
                      {...field}
                      aria-describedby="ingredients-hint"
                    />
                  </FormControl>
                  <FormDescription id="ingredients-hint">
                    Enter one ingredient per line. These map to pantry sync and shopping lists.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={'Mix dough until shaggy.\nRest 15 minutes.\nFold and proof until doubled.'}
                      {...field}
                      aria-describedby="instructions-hint"
                    />
                  </FormControl>
                  <FormDescription id="instructions-hint">
                    Steps are presented in order for guided cooking across devices.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment</FormLabel>
                  <FormControl>
                    <Textarea placeholder={'Anova Precision Oven\nQuarter sheet pan'} {...field} />
                  </FormControl>
                  <FormDescription>List the appliances or tools required to execute the recipe.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {mode === 'create' ? 'Create recipe' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
