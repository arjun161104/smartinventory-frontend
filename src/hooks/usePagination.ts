import { useState, useCallback } from "react"

type UsePaginationResult = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  setPage: (p: number) => void
  setPageSize: (size: number) => void
  setTotal: (t: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  from: number
  to: number
}

export function usePagination(initialPageSize = 20): UsePaginationResult {
  const [page, setPageState] = useState(0)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / pageSize) || 1

  const setPage = useCallback(
    (p: number) => {
      setPageState(Math.max(0, Math.min(p, totalPages - 1)))
    },
    [totalPages],
  )

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPageState(0)
  }, [])

  const nextPage = useCallback(() => {
    setPageState((prev) => Math.min(prev + 1, totalPages - 1))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPageState((prev) => Math.max(prev - 1, 0))
  }, [])

  const firstPage = useCallback(() => setPageState(0), [])
  const lastPage = useCallback(() => setPageState(totalPages - 1), [totalPages])

  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  return {
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    from,
    to,
  }
}
