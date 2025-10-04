import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-background text-foreground shadow-lg',
          actionButton: 'rounded-md bg-primary text-primary-foreground',
        },
      }}
      {...props}
    />
  )
}
