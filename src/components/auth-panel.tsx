import { useForm, type ControllerRenderProps } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useCurrentUser, useLogin, useLogout } from '@/hooks/useAuth'
import { selectIsAuthenticated, useAuthStore } from '@/stores/useAuthStore'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Skeleton } from './ui/skeleton'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export function AuthPanel() {
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
