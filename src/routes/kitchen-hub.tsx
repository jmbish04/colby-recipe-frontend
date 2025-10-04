import { useMemo } from 'react'
import { useForm, type ControllerRenderProps } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { AuthPanel } from '@/components/auth-panel'
import { IngredientList, type Ingredient } from '@/components/ingredient-list'
import { RecipeCard } from '@/components/recipe-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useRouteData } from '@/lib/routeData'

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const mealPlanSchema = z.object({
  mealName: z.string().min(2, 'Name must be at least 2 characters'),
  day: z.enum(weekDays),
})

type MealPlanFormValues = z.infer<typeof mealPlanSchema>
type Weekday = (typeof weekDays)[number]

export default function KitchenHubRoute() {
  const { data } = useRouteData('kitchen')
  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: { mealName: data.recipe.title, day: 'friday' as Weekday },
  })

  const handleSubmit = form.handleSubmit((values) => {
    toast.success(`Scheduled for ${values.day} – pantry items synced!`)
    form.reset(values)
  })

  const recommendedPairings = useMemo(() => data.recommendedPairings, [data.recommendedPairings])

  return (
    <section className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Smart kitchen hub
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Appliance-aware coordination</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Keep your appliances, pantry, and meal plan in sync. This dashboard surfaces the most actionable recipe insights for
            tonight\'s cooks.
          </p>
        </div>
        <Button onClick={() => toast.info('Toasts are styled via sonner + shadcn theme!')} variant="outline">
          Trigger toast
        </Button>
      </header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList aria-label="Kitchen hub sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pantry">Pantry sync</TabsTrigger>
          <TabsTrigger value="prep">Prep flow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <RecipeCard recipe={data.recipe} onCook={(recipe) => toast.message(`Cooking ${recipe.title}`)} />
          <div className="space-y-4">
            <AuthPanel />
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Schedule this recipe</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule & sync</DialogTitle>
                  <DialogDescription>
                    Choose when to cook this recipe and MenuForge will update your shopping and prep plan.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <FormField
                      control={form.control}
                      name="mealName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meal name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dinner title" {...field} />
                          </FormControl>
                          <FormDescription>This is how the meal will appear on your weekly plan.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="day"
                      render={({ field }: { field: ControllerRenderProps<MealPlanFormValues, 'day'> }) => (
                        <FormItem>
                          <FormLabel>Target day</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {weekDays.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Sync schedule</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <PairingsPanel items={recommendedPairings} />

            <div className="rounded-xl border border-border/60 bg-background/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI timeline preview
              </p>
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-3 h-3 w-5/6" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pantry" className="space-y-4">
          <IngredientList items={data.pantry as Ingredient[]} />
        </TabsContent>

        <TabsContent value="prep" className="space-y-4">
          <Accordion defaultValue={data.prepSections[0]?.title} type="single" collapsible>
            {data.prepSections.map((section) => (
              <AccordionItem key={section.title} value={section.title}>
                <AccordionTrigger>{section.title}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{section.details}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>
    </section>
  )
}

interface PairingsPanelProps {
  items: Array<{ title: string; note: string }>
}

function PairingsPanel({ items }: PairingsPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-background/50 p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">Suggested pairings</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-3 text-left"
          >
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </div>
            <Badge variant="outline">Auto suggested</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
