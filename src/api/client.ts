import axios from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api"

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function getToken(): string | null {
  return localStorage.getItem("accessToken")
}

function setToken(token: string): void {
  localStorage.setItem("accessToken", token)
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken")
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("currentUser")
  if (window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

function isAuthRoute(url?: string): boolean {
  if (!url) return false
  return url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")
}

function processPendingQueue(error: unknown, token: string | null = null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token)
      return
    }
    reject(error)
  })
  pendingQueue = []
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined
  const maybeAxiosError = error as { response?: { status?: number } }
  return maybeAxiosError.response?.status
}

function isInvalidRefreshResponse(error: unknown): boolean {
  const status = getStatusCode(error)
  return status === 400 || status === 401 || status === 403
}

function setAuthorizationHeader(config: InternalAxiosRequestConfig, token: string): void {
  const headers = config.headers as { set?: (name: string, value: string) => void; Authorization?: string } | undefined
  if (headers && typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`)
    return
  }

  if (config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    setAuthorizationHeader(config, token)
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && originalRequest && !isAuthRoute(originalRequest.url)) {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              setAuthorizationHeader(originalRequest, token)
              resolve(client(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post<{ accessToken: string }>(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        })
        setToken(data.accessToken)
        processPendingQueue(null, data.accessToken)

        setAuthorizationHeader(originalRequest, data.accessToken)
        return client(originalRequest)
      } catch (refreshError) {
        processPendingQueue(refreshError, null)
        if (isInvalidRefreshResponse(refreshError)) {
          clearAuthAndRedirect()
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default client
export { getToken, setToken, getRefreshToken }
