import client from "./client"

export type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type ApiResponse<T> = {
  data: T
  message?: string
}

export type ResourceApi<T, C = Partial<T>> = {
  getAll: (params?: Record<string, unknown>) => Promise<T[]>
  getPage: (params?: Record<string, unknown>) => Promise<Page<T>>
  getById: (id: number | string) => Promise<T>
  create: (payload: C) => Promise<T>
  update: (id: number | string, payload: Partial<T>) => Promise<T>
  remove: (id: number | string) => Promise<void>
}

export function createResource<T, C = Partial<T>>(endpoint: string): ResourceApi<T, C> {
  return {
    getAll: (params) =>
      client.get(endpoint, { params }).then((r) => r.data),

    getPage: (params) =>
      client.get(`${endpoint}/page`, { params }).then((r) => r.data),

    getById: (id) =>
      client.get(`${endpoint}/${id}`).then((r) => r.data),

    create: (payload) =>
      client.post(endpoint, payload).then((r) => r.data),

    update: (id, payload) =>
      client.put(`${endpoint}/${id}`, payload).then((r) => r.data),

    remove: (id) =>
      client.delete(`${endpoint}/${id}`),
  }
}
