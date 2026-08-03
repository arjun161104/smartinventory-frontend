import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useAppQuery<T>(
  key: unknown[],
  fn: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fn,
    staleTime: 30_000,
    enabled: options?.enabled,
  })
}

export function useAppMutation<TData, TVariables>(
  fn: (vars: TVariables) => Promise<TData>,
  options?: {
    invalidateKeys?: unknown[][]
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()

  const onSettled = useCallback(() => {
    if (options?.invalidateKeys) {
      options.invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    }
  }, [queryClient, options?.invalidateKeys])

  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      onSettled()
    },
    onError: options?.onError,
  })
}
