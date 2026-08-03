import { useState, useCallback } from "react"
import { useApi } from "./useApi"
import type { ResourceApi } from "../api/resource"

type UseCrudResult<T> = {
  rows: T[]
  loading: boolean
  error: string | null
  selected: T | null
  select: (row: T | null) => void
  refresh: () => void
  create: (payload: Partial<T>) => Promise<T | null>
  update: (id: number | string, payload: Partial<T>) => Promise<T | null>
  remove: (id: number | string) => Promise<boolean>
}

export function useCrud<T>(api: ResourceApi<T>): UseCrudResult<T> {
  const [selected, setSelected] = useState<T | null>(null)

  const fetchAll = useCallback(() => api.getAll(), [api])

  const { data, loading, error, refetch } = useApi(fetchAll, [api])

  const create = useCallback(
    async (payload: Partial<T>): Promise<T | null> => {
      try {
        const result = await api.create(payload as T)
        refetch()
        return result
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Create failed"
        throw new Error(msg)
      }
    },
    [api, refetch],
  )

  const update = useCallback(
    async (id: number | string, payload: Partial<T>): Promise<T | null> => {
      try {
        const result = await api.update(id, payload)
        refetch()
        return result
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Update failed"
        throw new Error(msg)
      }
    },
    [api, refetch],
  )

  const remove = useCallback(
    async (id: number | string): Promise<boolean> => {
      try {
        await api.remove(id)
        refetch()
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Delete failed"
        throw new Error(msg)
      }
    },
    [api, refetch],
  )

  return {
    rows: data ?? [],
    loading,
    error,
    selected,
    select: setSelected,
    refresh: refetch,
    create,
    update,
    remove,
  }
}
