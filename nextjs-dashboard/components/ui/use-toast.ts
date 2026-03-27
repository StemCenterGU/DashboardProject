// Simple toast implementation
import { useState, useCallback } from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

// Global toast state (simple implementation)
let toastCallback: ((toast: ToastProps) => void) | null = null

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((props: ToastProps) => {
    // For now, just use alert as a simple fallback
    if (props.variant === "destructive") {
      alert(`Error: ${props.title}\n${props.description || ''}`)
    } else {
      alert(`${props.title}\n${props.description || ''}`)
    }
  }, [])

  return { toast, toasts }
}
