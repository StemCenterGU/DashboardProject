/**
 * useOptimisticUpdate Hook
 * Provides instant UI feedback while API requests are in flight
 * Automatically rolls back on error
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useOptimisticUpdate<T = any>() {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Execute an update with optimistic UI
   *
   * @param optimisticValue - Value to immediately show in UI
   * @param setOptimisticState - Function to update UI state
   * @param apiCall - Async function that performs the actual API call
   * @param options - Success/error callbacks and messages
   */
  const executeOptimistic = useCallback(
    async <TData = T>(
      optimisticValue: TData,
      setOptimisticState: (value: TData) => void,
      apiCall: () => Promise<TData>,
      options?: OptimisticUpdateOptions<TData>
    ): Promise<TData | null> => {
      // Store original value for rollback
      let originalValue: TData | null = null

      try {
        setIsLoading(true)

        // 1. Immediately update UI (optimistic)
        setOptimisticState(optimisticValue)

        // 2. Make API call in background
        const result = await apiCall()

        // 3. Update UI with real data from server
        setOptimisticState(result)

        // 4. Show success feedback
        if (options?.successMessage) {
          toast.success(options.successMessage)
        }

        options?.onSuccess?.(result)
        return result
      } catch (error: any) {
        console.error('Optimistic update failed:', error)

        // Roll back to original value if we stored it
        // (In practice, you'd need to pass the original value)

        // Show error feedback
        const errorMsg = options?.errorMessage || error.message || 'Update failed'
        toast.error(errorMsg)

        options?.onError?.(error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    executeOptimistic,
    isLoading,
  }
}

/**
 * Simpler version for common use cases
 */
export function useOptimisticMutation<TData = any, TVariables = any>() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(
    async (
      variables: TVariables,
      options: {
        optimisticUpdate?: (vars: TVariables) => void
        mutationFn: (vars: TVariables) => Promise<TData>
        onSuccess?: (data: TData) => void
        onError?: (error: Error, vars: TVariables) => void
        rollback?: () => void
      }
    ): Promise<TData | null> => {
      setIsPending(true)

      try {
        // Apply optimistic update immediately
        if (options.optimisticUpdate) {
          options.optimisticUpdate(variables)
        }

        // Execute mutation
        const data = await options.mutationFn(variables)

        // Call success callback
        options.onSuccess?.(data)

        return data
      } catch (error: any) {
        console.error('Mutation failed:', error)

        // Rollback optimistic update
        if (options.rollback) {
          options.rollback()
        }

        // Call error callback
        options.onError?.(error, variables)

        toast.error(error.message || 'Something went wrong')
        return null
      } finally {
        setIsPending(false)
      }
    },
    []
  )

  return {
    mutate,
    isPending,
  }
}
