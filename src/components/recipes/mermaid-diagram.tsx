import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

interface MermaidDiagramProps {
  definition: string
  summary?: string
  className?: string
}

export function MermaidDiagram({ definition, summary, className }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const diagramId = useMemo(() => `mermaid-${crypto.randomUUID()}`, [])

  useEffect(() => {
    let isMounted = true

    async function renderDiagram() {
      setIsLoading(true)
      setError(null)

      try {
        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default ?? mermaidModule
        mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'neutral' })
        const { svg } = await mermaid.render(diagramId, definition)
        if (!isMounted) {
          return
        }

        setSvg(svg)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setError(error instanceof Error ? error.message : 'Unable to render workflow diagram')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void renderDiagram()

    return () => {
      isMounted = false
    }
  }, [definition, diagramId])

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive',
          className,
        )}
      >
        <p className="font-medium">Workflow diagram unavailable</p>
        <p className="mt-1 text-xs opacity-90">{error}</p>
        <details className="mt-3 text-xs opacity-90">
          <summary className="cursor-pointer text-foreground">View Mermaid definition</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-background/50 p-3 text-[11px] text-foreground/80">
            {definition}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4',
        className,
      )}
      aria-live="polite"
    >
      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          Generating workflow diagram…
        </div>
      ) : (
        <div
          className="min-h-[240px]"
          role="img"
          aria-label={summary ?? 'Recipe workflow diagram'}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  )
}
