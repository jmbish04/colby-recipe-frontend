import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export default function NotFoundRoute() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">Lost in the kitchen</h1>
        <p className="text-sm text-muted-foreground">
          The route you were looking for isn&apos;t on the menu yet. Choose another experience from the navigation.
        </p>
      </div>
      <Button asChild>
        <Link to="/kitchen">Return to kitchen hub</Link>
      </Button>
    </div>
  )
}
