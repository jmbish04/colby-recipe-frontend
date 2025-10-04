import { useMemo } from 'react'
import { useForm, type ControllerRenderProps } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { IngredientList, type Ingredient } from '@/components/ingredient-list'
import { RecipeCard, type Recipe } from '@/components/recipe-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useCurrentUser, useLogin, useLogout } from '@/hooks/useAuth'
import { selectIsAuthenticated, useAuthStore } from '@/stores/useAuthStore'

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const mealPlanSchema = z.object({
  mealName: z.string().min(2, 'Name must be at least 2 characters'),
  day: z.enum(weekDays),
})

type MealPlanFormValues = z.infer<typeof mealPlanSchema>
type Weekday = (typeof weekDays)[number]

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const sampleRecipe: Recipe = {
  id: 'recipe-001',
  title: 'Sous-vide miso salmon',
  summary: 'Precise temperature control paired with a citrus glaze and crispy finish.',
  cookTime: '45 min',
  servings: 2,
  tags: ['sous-vide', 'weeknight', 'omega rich'],
  completion: 68,
}

const pantryIngredients: Ingredient[] = [
  { name: 'Fresh salmon fillet', quantity: '2 x 150g portions', pantryStatus: 'low' },
  { name: 'White miso paste', quantity: '3 tbsp', pantryStatus: 'available' },
  { name: 'Blood orange', quantity: '1 whole', pantryStatus: 'missing' },
  { name: 'Spring onions', quantity: '2 stalks', pantryStatus: 'missing' },
]

const prepSections = [
  {
    title: 'Water bath warmup',
    details: 'Bring the sous-vide bath to 50°C. While heating, assemble the miso marinade and seal the salmon.',
  },
  {
    title: 'Infuse & chill',
    details: 'Marinate sealed fish for 20 minutes. Prep aromatics and a finishing torch station while you wait.',
  },
  {
    title: 'Finish & plate',
    details: 'Flash torch the fish for caramelization, glaze with reduced marinade, and plate alongside citrus segments.',
  },
]

export default function App() {
  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: { mealName: sampleRecipe.title, day: 'friday' as Weekday },
  })

  const recommendedPairings = useMemo(
    () => [
      { title: 'Yuzu spritz', note: 'Bright sparkling cocktail that mirrors the marinade acidity.' },
      { title: 'Shaved fennel salad', note: 'Crunchy counterpoint with a citrus dressing.' },
      { title: 'Rice cooker farro', note: 'Whole-grain base using appliance aware mode.' },
    ],
    [],
  )

  const handleSubmit = form.handleSubmit((values) => {
    toast.success(`Scheduled for ${values.day} – pantry items synced!`)
    form.reset(values)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted/40">
      <div className="container space-y-10 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
              MenuForge
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Design system foundation
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Reusable shadcn/ui components wired for rapid recipe tooling inside the Cloudflare runtime.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => toast.info('Toasts are styled via sonner + shadcn theme!')} variant="outline">
              Trigger toast
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pantry">Pantry sync</TabsTrigger>
            <TabsTrigger value="prep">Prep flow</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          >
            <RecipeCard recipe={sampleRecipe} onCook={(recipe: Recipe) => toast.message(`Cooking ${recipe.title}`)} />
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

              <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-background/50 p-4">
                <h2 className="text-sm font-semibold text-muted-foreground">Suggested pairings</h2>
                <ul className="space-y-2 text-sm">
                  {recommendedPairings.map((item) => (
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
            <IngredientList items={pantryIngredients} />
          </TabsContent>

          <TabsContent value="prep" className="space-y-4">
            <Accordion defaultValue={prepSections[0].title} type="single" collapsible>
              {prepSections.map((section) => (
                <AccordionItem key={section.title} value={section.title}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {section.details}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AuthPanel() {
  const loginMutation = useLogin()
  const logout = useLogout()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore((state) => state.user)
  const { isFetching: isFetchingUser } = useCurrentUser()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleSubmit = form.handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => form.reset({ email: values.email, password: '' }),
    })
  })

  return (
    <Card className="border border-border/70 bg-background/50">
      <CardHeader className="pb-3">
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Sign in to access personalized appliance automations.</CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-card/60 p-4">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(user.roles ?? ['member']).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={logout} variant="outline">
              Sign out
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: ControllerRenderProps<LoginFormValues, 'email'> }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input autoComplete="email" placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: ControllerRenderProps<LoginFormValues, 'password'> }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input autoComplete="current-password" placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" disabled={loginMutation.isPending} type="submit">
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
              <FormDescription className="text-xs">
                Credentials are stored securely in session storage and refreshed automatically when needed.
              </FormDescription>
            </form>
          </Form>
        )}
        {isAuthenticated && isFetchingUser && (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
