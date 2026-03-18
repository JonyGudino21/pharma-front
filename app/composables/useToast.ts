import { ref } from 'vue'

const toasts = ref<{ id: number, message:string, type: 'success' | 'error' | 'warning' | 'info' }[]>([])
let nextId = 0

export const useToast = () => {
  const add = (message:string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = nextId++
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      toasts.value = toasts.value.filter(toast => toast.id !== id)
    }, 4000)
  }

  const remove = (id:number) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  return {
    toasts,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info: (msg: string) => add(msg, 'info'),
    remove,
  }
}
