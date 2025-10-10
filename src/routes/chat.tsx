import { MessageCircle, Pin, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { useRouteData, type ChatMessage, type ChatMessageContent, type RecipeMessage } from '@/lib/routeData'
import { cn } from '@/lib/utils'

export default function ChatRoute() {
  const { data } = useRouteData('chat')

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">AI Sous Chef</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Multi-modal cooking intelligence that keeps context between your appliances, pantry, and planner.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.quickPrompts.map((prompt) => (
          <Card key={prompt.title} className="border border-border/70 bg-background/60">
            <CardHeader className="flex flex-row items-start gap-4">
              <div aria-hidden className="text-3xl" role="img">
                {prompt.icon}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">{prompt.title}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Launch {prompt.title.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-dashed border-border/70 bg-card/60">
        <CardHeader className="flex items-center gap-3">
          <Pin className="h-5 w-5" aria-hidden="true" />
          <div>
            <CardTitle className="text-xl">Pinned threads</CardTitle>
            <CardDescription>Jump back into on-going experiences across your smart kitchen.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pinnedThreads.map((thread) => (
            <div
              key={thread.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 p-4"
            >
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                  {thread.title}
                </p>
                <p className="text-xs text-muted-foreground">{thread.lastActivity}</p>
              </div>
              <Button size="sm" variant="secondary">
                Reopen
              </Button>
            </div>
          ))}
          <Separator />
          <p className="text-xs text-muted-foreground">
            Conversations stream over SSE via the Cloudflare Worker. Streaming hooks connect directly to the chat canvas.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-background/70">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Live thread</CardTitle>
          <CardDescription>
            Streaming context-aware responses from the MenuForge AI Sous Chef with generative recipe cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-6">
            {data.messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  )
}

function isRecipeContent(content: ChatMessageContent): content is RecipeMessage {
  return typeof content === 'object' && content !== null && 'type' in content && content.type === 'recipe'
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'

  if (isRecipeContent(message.content)) {
    return (
      <li className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>AI Sous Chef recipe drop</span>
        </div>
        <RecipeCard recipe={message.content.data} className="border-primary/50 shadow-xl" />
        <p className="text-xs text-muted-foreground">AI Sous Chef · {message.timestamp}</p>
      </li>
    )
  }

  return (
    <li className={cn('flex flex-col gap-1', isAssistant ? 'items-start text-left' : 'items-end text-right')}>
      <div
        className={cn(
          'max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition',
          isAssistant
            ? 'bg-muted/70 text-foreground backdrop-blur'
            : 'bg-primary text-primary-foreground shadow-primary/40',
        )}
      >
        {message.content}
      </div>
      <span className="text-xs text-muted-foreground">
        {isAssistant ? 'AI Sous Chef' : 'You'} · {message.timestamp}
      </span>
    </li>
  )
}
