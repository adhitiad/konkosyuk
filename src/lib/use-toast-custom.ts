import { toast } from '@/components/ui/toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

function addToast(title: string, description: string, type: ToastType) {
  toast({ title, description, type })
}

export function showToastSuccess(message: string, title?: string) {
  addToast(title || 'Berhasil', message, 'success')
}

export function showToastError(message: string, title?: string) {
  addToast(title || 'Gagal', message, 'error')
}

export function showToastWarning(message: string, title?: string) {
  addToast(title || 'Peringatan', message, 'warning')
}

export function showToastInfo(message: string, title?: string) {
  addToast(title || 'Info', message, 'info')
}
