import { toast as sonnerToast } from 'vue-sonner'

export function useToast() {
  function toast(options: { title?: string; description?: string; variant?: 'destructive' | 'default' | 'success', duration?: number } | string) {
    if (typeof options === 'string') {
      sonnerToast.success(options)
      return
    }

    const message = options.title || options.description || 'Успешно'
    
    if (options.variant === 'destructive') {
      sonnerToast.error(message, { description: options.description !== message ? options.description : undefined })
    } else if (options.variant === 'default') {
      sonnerToast(message, { description: options.description !== message ? options.description : undefined })
    } else {
      sonnerToast.success(message, { description: options.description !== message ? options.description : undefined })
    }
  }

  return { toast }
}
