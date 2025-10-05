import { toast, type ExternalToast } from 'sonner'

type ToastKind = 'message' | 'success' | 'error' | 'info' | 'warning'

const activeToasts = new Map<string, ReturnType<typeof setTimeout>>()

function normalizeMessage(message: string, kind: ToastKind) {
  const normalizedMessage = message.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 64)
  return `${kind}-${normalizedMessage || crypto.randomUUID()}`
}

function scheduleRelease(id: string, duration: number, onRelease?: () => void) {
  const timer = setTimeout(() => {
    activeToasts.delete(id)
    if (onRelease) {
      onRelease()
    }
  }, duration)

  activeToasts.set(id, timer)
}

function clearTimer(id: string) {
  const timer = activeToasts.get(id)
  if (timer) {
    clearTimeout(timer)
    activeToasts.delete(id)
  }
}

function showToast(kind: ToastKind, message: string, options?: ExternalToast) {
  const id = String(options?.id ?? normalizeMessage(message, kind))

  if (activeToasts.has(id)) {
    return id
  }

  const duration = options?.duration ?? 4000

  const onDismiss = options?.onDismiss
  const onAutoClose = options?.onAutoClose

  const mergedOptions: ExternalToast = {
    ...options,
    id,
    onDismiss: (toastId) => {
      clearTimer(id)
      onDismiss?.(toastId)
    },
    onAutoClose: (toastId) => {
      clearTimer(id)
      onAutoClose?.(toastId)
    },
  }

  switch (kind) {
    case 'success':
      toast.success(message, mergedOptions)
      break
    case 'error':
      toast.error(message, mergedOptions)
      break
    case 'info':
      toast.info(message, mergedOptions)
      break
    case 'warning':
      toast.warning(message, mergedOptions)
      break
    default:
      toast(message, mergedOptions)
      break
  }

  scheduleRelease(id, duration + 200)
  return id
}

export const showErrorToast = (message: string, options?: ExternalToast) => showToast('error', message, options)
export const showSuccessToast = (message: string, options?: ExternalToast) => showToast('success', message, options)
export const showInfoToast = (message: string, options?: ExternalToast) => showToast('info', message, options)
export const showWarningToast = (message: string, options?: ExternalToast) => showToast('warning', message, options)
export const showMessageToast = (message: string, options?: ExternalToast) => showToast('message', message, options)
