import { Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChefHat, Menu } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { prefetchRouteData, type RouteName } from '@/lib/routeData'

export interface AppNavItem {
  key: RouteName
  to: string
  label: string
  description: string
  icon: ReactNode
}

interface AppShellProps {
  navItems: AppNavItem[]
}

export function AppShell({ navItems }: AppShellProps) {
  const location = useLocation()
  const queryClient = useQueryClient()

  const activeItem = useMemo(
    () => navItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)),
    [location.pathname, navItems],
  )

  useEffect(() => {
    const likelyNext = navItems.filter((item) => item.key !== activeItem?.key).slice(0, 2)
    likelyNext.forEach((item) => {
      void prefetchRouteData(queryClient, item.key)
    })
  }, [activeItem?.key, navItems, queryClient])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted/40">
      <div className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <ChefHat className="h-7 w-7 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">MenuForge</p>
              <p className="text-sm font-semibold text-foreground">Culinary control center</p>
            </div>
          </div>
          <nav aria-label="Primary" className="hidden items-center gap-4 md:flex">
            <DesktopNavigation navItems={navItems} activeKey={activeItem?.key} />
            <ThemeToggle />
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileNavigation navItems={navItems} />
          </div>
        </div>
      </div>
      <main className="container space-y-10 py-10">
        <Suspense fallback={<RouteSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

interface DesktopNavigationProps {
  navItems: AppNavItem[]
  activeKey: RouteName | undefined
}

function DesktopNavigation({ navItems, activeKey }: DesktopNavigationProps) {
  const queryClient = useQueryClient()

  return (
    <NavigationMenu aria-label="Primary">
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.key}>
            <NavigationMenuLink asChild>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`
                }
                aria-label={`${item.label} – ${item.description}`}
                onFocus={() => void prefetchRouteData(queryClient, item.key)}
                onMouseEnter={() => void prefetchRouteData(queryClient, item.key)}
                onTouchStart={() => void prefetchRouteData(queryClient, item.key)}
                aria-current={activeKey === item.key ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
                <span className="sr-only">{item.description}</span>
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      <NavigationMenuIndicator />
    </NavigationMenu>
  )
}

interface MobileNavigationProps {
  navItems: AppNavItem[]
}

function MobileNavigation({ navItems }: MobileNavigationProps) {
  const queryClient = useQueryClient()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline">
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:max-w-xs">
        <div className="space-y-2 py-4">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Navigate</p>
          <nav aria-label="Primary mobile" className="grid gap-2">
            {navItems.map((item) => (
              <SheetClose asChild key={item.key}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md border border-border/60 px-3 py-3 text-sm transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isActive ? 'bg-muted text-foreground' : 'bg-background/80 text-muted-foreground hover:bg-background'
                    }`
                  }
                  aria-label={`${item.label} – ${item.description}`}
                  onFocus={() => void prefetchRouteData(queryClient, item.key)}
                  onMouseEnter={() => void prefetchRouteData(queryClient, item.key)}
                  onTouchStart={() => void prefetchRouteData(queryClient, item.key)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="flex flex-col">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <span className="sr-only">Go to the {item.label} experience</span>
                </NavLink>
              </SheetClose>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RouteSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}
