import { toast as sonnerToast } from 'vue-sonner'

export function useToast() {
  type ToastVariant = 'destructive' | 'error' | 'default' | 'success'

  function toast(options: { title?: string; description?: string; variant?: ToastVariant; duration?: number } | string) {
    if (typeof options === 'string') {
      sonnerToast.success(options)
      return
    }

    const message = options.title || options.description || 'Успешно'
    const desc = options.description !== message ? options.description : undefined
    const variant = options.variant ?? 'success'

    if (variant === 'destructive' || variant === 'error') {
      sonnerToast.error(message, { description: desc, duration: options.duration })
    } else if (variant === 'default') {
      sonnerToast(message, { description: desc, duration: options.duration })
    } else {
      sonnerToast.success(message, { description: desc, duration: options.duration })
    }
  }

  return { toast }
}
