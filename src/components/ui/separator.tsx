import * as SeparatorPrimitive from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'

const Separator = ({ className, orientation = 'horizontal', decorative = true, ...props }: SeparatorPrimitive.SeparatorProps) => (
  <SeparatorPrimitive.Root
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    decorative={decorative}
    orientation={orientation}
    {...props}
  />
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
