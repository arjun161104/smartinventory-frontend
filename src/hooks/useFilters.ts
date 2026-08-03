import { useState, useCallback, useMemo } from "react"

type FilterValue = string | [string, string] | undefined

type UseFiltersResult<T extends Record<string, FilterValue>> = {
  filters: T
  setFilter: (name: keyof T, value: FilterValue) => void
  clearFilters: () => void
  clearFilter: (name: keyof T) => void
  activeCount: number
  params: Record<string, string>
}

export function useFilters<T extends Record<string, FilterValue>>(initialFilters: T): UseFiltersResult<T> {
  const [filters, setFilters] = useState<T>(initialFilters)

  const setFilter = useCallback((name: keyof T, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const clearFilter = useCallback((name: keyof T) => {
    setFilters((prev) => ({ ...prev, [name]: initialFilters[name] }))
  }, [initialFilters])

  const activeCount = useMemo(() => {
    let count = 0
    for (const val of Object.values(filters)) {
      if (val !== undefined && val !== "" && val !== "") {
        if (Array.isArray(val)) {
          if (val[0] || val[1]) count++
        } else {
          count++
        }
      }
    }
    return count
  }, [filters])

  const params = useMemo(() => {
    const p: Record<string, string> = {}
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== "") {
        if (Array.isArray(val)) {
          if (val[0]) p[`${key}From`] = val[0]
          if (val[1]) p[`${key}To`] = val[1]
        } else {
          p[key] = val
        }
      }
    }
    return p
  }, [filters])

  return { filters, setFilter, clearFilters, clearFilter, activeCount, params }
}
