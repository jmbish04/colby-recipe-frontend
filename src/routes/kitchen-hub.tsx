import { useEffect, useMemo, useRef, useState } from 'react'
import { type ControllerRenderProps, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react'

import { AuthPanel } from '@/components/auth-panel'
import { IngredientList } from '@/components/ingredient-list'
import { RecipeCard } from '@/components/recipe-card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  useApplianceStatus,
  useAppliancesQuery,
  useCreateApplianceMutation,
  useDeleteApplianceMutation,
  useRetryApplianceProcessingMutation,
  type Appliance,
} from '@/hooks/useAppliances'
import { useRouteData } from '@/lib/routeData'

const addApplianceSchema = z
  .object({
    brand: z.string().min(2, 'Brand must be at least 2 characters').max(80, 'Brand must be 80 characters or less'),
    model: z.string().min(1, 'Model is required').max(80, 'Model must be 80 characters or less'),
    nickname: z
      .string()
      .max(60, 'Nickname must be 60 characters or less')
      .optional()
      .transform((value) => {
        const trimmed = value?.trim()
        return trimmed && trimmed.length > 0 ? trimmed : undefined
      }),
    manual: z
      .custom<File>((value) => typeof File !== 'undefined' && value instanceof File, {
        message: 'Manual PDF is required',
      })
      .refine((file) => file.type === 'application/pdf', 'Manual must be a PDF document')
      .refine((file) => file.size <= 25 * 1024 * 1024, 'Manual must be 25MB or less'),
  })

type AddApplianceFormInput = z.input<typeof addApplianceSchema>
type AddApplianceFormValues = z.output<typeof addApplianceSchema>

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const mealPlanSchema = z.object({
  mealName: z.string().min(2, 'Name must be at least 2 characters'),
  day: z.enum(weekDays),
})

type MealPlanFormValues = z.infer<typeof mealPlanSchema>
type Weekday = (typeof weekDays)[number]

const applianceSkeletonItems = Array.from({ length: 3 }, (_, index) => index)

export default function KitchenHubRoute() {
  const { data } = useRouteData('kitchen')
  const appliancesQuery = useAppliancesQuery()
  const createAppliance = useCreateApplianceMutation()
  const deleteAppliance = useDeleteApplianceMutation()
  const retryProcessing = useRetryApplianceProcessingMutation()

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
      <header className="space-y-3">
        <Badge variant="secondary" className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Smart kitchen hub
        </Badge>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Appliance orchestration</h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Register countertop and built-in appliances, upload PDF manuals, and monitor processing so MenuForge can tailor
              every cook to the hardware in your kitchen.
            </p>
          </div>
          <Button onClick={() => toast.info('Toasts are styled via sonner + shadcn theme!')} variant="outline">
            Trigger toast
          </Button>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ApplianceManager
          appliances={appliancesQuery.data ?? []}
          isLoading={appliancesQuery.isLoading}
          isFetching={appliancesQuery.isFetching}
          createMutation={createAppliance}
          deleteMutation={deleteAppliance}
          retryMutation={retryProcessing}
        />

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Tonight&apos;s featured recipe</CardTitle>
              <CardDescription>Sync prep, pantry, and appliance readiness in one place.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RecipeCard recipe={data.recipe} onCook={(recipe) => toast.message(`Cooking ${recipe.title}`)} />
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  MenuForge keeps this recipe aligned with your registered appliances. Once manuals finish processing, bespoke
                  steps and temperature windows unlock automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Schedule & sync</CardTitle>
              <CardDescription>Choose when to cook and let MenuForge stage grocery and prep updates.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <AuthPanel />

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Suggested pairings</CardTitle>
              <CardDescription>Auto suggested complements based on your appliance lineup.</CardDescription>
            </CardHeader>
            <CardContent>
              <PairingsPanel items={recommendedPairings} />
            </CardContent>
          </Card>

          <Tabs defaultValue="pantry" className="space-y-4">
            <TabsList aria-label="Kitchen hub sections">
              <TabsTrigger value="pantry">Pantry sync</TabsTrigger>
              <TabsTrigger value="prep">Prep flow</TabsTrigger>
            </TabsList>
            <TabsContent value="pantry" className="space-y-4">
              <IngredientList items={data.pantry} />
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
        </div>
      </div>
    </section>
  )
}

interface ApplianceManagerProps {
  appliances: Appliance[]
  isLoading: boolean
  isFetching: boolean
  createMutation: ReturnType<typeof useCreateApplianceMutation>
  deleteMutation: ReturnType<typeof useDeleteApplianceMutation>
  retryMutation: ReturnType<typeof useRetryApplianceProcessingMutation>
}

function ApplianceManager({
  appliances,
  isLoading,
  isFetching,
  createMutation,
  deleteMutation,
  retryMutation,
}: ApplianceManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const showEmptyState = !isLoading && appliances.length === 0

  return (
    <section aria-labelledby="appliance-manager-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="appliance-manager-heading" className="text-xl font-semibold tracking-tight">
            My kitchen appliances
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload manuals, monitor processing, and keep hardware ready for AI-powered cooking.
          </p>
        </div>
        <AddApplianceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} mutation={createMutation} />
      </div>

      {isFetching ? (
        <p aria-live="polite" className="text-xs font-medium text-muted-foreground">
          Refreshing appliance statuses…
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2" role="status" aria-live="polite">
          {applianceSkeletonItems.map((item) => (
            <Card key={item} className="space-y-4 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : showEmptyState ? (
        <EmptyApplianceState onAdd={() => setIsDialogOpen(true)} isPending={createMutation.status === 'pending'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2" role="list">
          {appliances.map((appliance) => (
            <ApplianceCard
              key={appliance.id}
              appliance={appliance}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === appliance.id}
              onRetry={() => retryMutation.mutate(appliance.id)}
              isRetrying={retryMutation.isPending && retryMutation.variables === appliance.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface AddApplianceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mutation: ReturnType<typeof useCreateApplianceMutation>
}

function AddApplianceDialog({ open, onOpenChange, mutation }: AddApplianceDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const form = useForm<AddApplianceFormInput, undefined, AddApplianceFormValues>({
    resolver: zodResolver(addApplianceSchema),
    defaultValues: {
      brand: '',
      model: '',
      nickname: '',
      manual: undefined,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [open, form])

  const handleSubmit = form.handleSubmit((values: AddApplianceFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add appliance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new appliance</DialogTitle>
          <DialogDescription>
            Upload the PDF manual so MenuForge can map capabilities and surface personalised guidance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Anova" autoComplete="organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Model name" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="How you refer to this appliance" {...field} />
                  </FormControl>
                  <FormDescription>This nickname helps surface the right appliance in voice commands.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manual"
              render={({ field }) => {
                const { value, ref, onChange, onBlur, name, ...rest } = field

                return (
                  <FormItem>
                    <FormLabel>Manual (PDF)</FormLabel>
                    <FormControl>
                      <Input
                        {...rest}
                        name={name}
                        onBlur={onBlur}
                        ref={(element) => {
                          ref(element)
                          fileInputRef.current = element
                        }}
                        type="file"
                        accept="application/pdf"
                        aria-describedby="manual-help"
                        disabled={mutation.status === 'pending'}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          onChange(file ?? undefined)
                        }}
                      />
                    </FormControl>
                    {value instanceof File ? (
                      <p className="text-xs text-muted-foreground" id="manual-help">
                        Selected file: {value.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground" id="manual-help">
                        Upload a PDF up to 25MB.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            {mutation.status === 'pending' ? (
              <div className="space-y-2" aria-live="assertive">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Uploading manual…</span>
                  <span className="font-medium text-foreground">{mutation.progress}%</span>
                </div>
                <Progress value={mutation.progress} aria-label="Upload progress" />
              </div>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={mutation.status === 'pending'}>
                {mutation.status === 'pending' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Uploading…
                  </span>
                ) : (
                  'Add appliance'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface ApplianceCardProps {
  appliance: Appliance
  onDelete: (id: string) => void
  isDeleting: boolean
  onRetry: () => void
  isRetrying: boolean
}

function ApplianceCard({ appliance, onDelete, isDeleting, onRetry, isRetrying }: ApplianceCardProps) {
  const { appliance: trackedAppliance, isPolling } = useApplianceStatus(appliance)
  const status = trackedAppliance.status
  const isQueued = status === 'queued'
  const isProcessing = status === 'processing'
  const isErrored = status === 'error'
  const processingProgress = trackedAppliance.processingProgress ?? (isProcessing ? 24 : 0)
  const manualUrl = trackedAppliance.manualUrl

  return (
    <Card role="listitem" className="flex h-full flex-col justify-between">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {trackedAppliance.brand}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{trackedAppliance.model}</CardDescription>
            {trackedAppliance.nickname ? (
              <p className="mt-1 text-xs text-muted-foreground">Nickname: {trackedAppliance.nickname}</p>
            ) : null}
          </div>
          <StatusBadge status={status} isPolling={isPolling} />
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            Uploaded <time dateTime={trackedAppliance.uploadedAt}>{formatDateTime(trackedAppliance.uploadedAt)}</time>
          </p>
          <p>
            Updated <time dateTime={trackedAppliance.updatedAt}>{formatDateTime(trackedAppliance.updatedAt)}</time>
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate" title={trackedAppliance.manualFileName ?? undefined}>
            {trackedAppliance.manualFileName ?? 'Manual processing…'}
          </span>
        </div>
        {isQueued ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Manual queued for processing…
          </p>
        ) : null}
        {isProcessing ? (
          <div className="space-y-1" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Processing manual…</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} aria-label="Processing progress" />
          </div>
        ) : null}
        {isErrored && trackedAppliance.statusDetail ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {trackedAppliance.statusDetail}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            size="sm"
            asChild
            disabled={!manualUrl || isQueued || isProcessing || isErrored}
          >
            <a
              href={manualUrl ?? '#'}
              aria-disabled={!manualUrl || isQueued || isProcessing || isErrored}
              target="_blank"
              rel="noreferrer"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              View manual
            </a>
          </Button>
          {isErrored ? (
            <Button
              variant="secondary"
              className="gap-2"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Retrying…
                </span>
              ) : (
                'Retry processing'
              )}
            </Button>
          ) : null}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              size="sm"
              aria-label={`Remove ${trackedAppliance.brand} ${trackedAppliance.model}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove appliance?</AlertDialogTitle>
              <AlertDialogDescription>
                This will pause tailored automations until you add the appliance again. Manuals remain safely stored.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Keep</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={() => onDelete(trackedAppliance.id)}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Removing…
                  </span>
                ) : (
                  'Remove appliance'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status, isPolling }: { status: Appliance['status']; isPolling: boolean }) {
  if (status === 'ready') {
    return <Badge variant="secondary">Ready</Badge>
  }

  if (status === 'queued') {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Queued
      </Badge>
    )
  }

  if (status === 'processing') {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-2 border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-300"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {isPolling ? 'Processing…' : 'Processing'}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-destructive text-destructive">
      Action needed
    </Badge>
  )
}

interface EmptyApplianceStateProps {
  onAdd: () => void
  isPending: boolean
}

function EmptyApplianceState({ onAdd, isPending }: EmptyApplianceStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="space-y-2">
        <CardTitle className="text-lg">No appliances yet</CardTitle>
        <CardDescription className="max-w-sm text-sm text-muted-foreground">
          Start by uploading a PDF manual. We&apos;ll process the capabilities and surface smarter prep workflows instantly.
        </CardDescription>
      </div>
      <Button type="button" onClick={onAdd} className="gap-2" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Add your first appliance
      </Button>
    </Card>
  )
}

interface PairingsPanelProps {
  items: Array<{ title: string; note: string }>
}

function PairingsPanel({ items }: PairingsPanelProps) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 p-3 text-left"
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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
