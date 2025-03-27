import {
  useToast as useVueToast,
  type ToastPluginApi,
  type ToastProps,
} from 'vue-toast-notification'

export function useToast(options?: Partial<ToastProps>): ToastPluginApi {
  if (options != undefined) {
    return useVueToast(options)
  }
  return useVueToast({ position: 'top', dismissible: true, duration: 3000 })
}
