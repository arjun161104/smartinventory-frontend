import client, { setToken } from "./client"

export type LoginRequest = {
  username: string 
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    username: string
    email: string
    roles: string[]
  }
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

export type UserProfile = {
  id: number
  username: string
  email: string
  roles: string[]
}

export type StoredUser = {
  username: string
  roles: string[]
}

export function storeUser(user: StoredUser): void {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export function getCurrentUser(): StoredUser | null {
  const raw = localStorage.getItem("currentUser")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>("/auth/login", payload)
  setToken(data.accessToken)
  localStorage.setItem("refreshToken", data.refreshToken)
  storeUser({ username: data.user.username, roles: data.user.roles })
  return data
}

export async function register(payload: RegisterRequest): Promise<void> {
  await client.post("/auth/register", payload)
}

export async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem("refreshToken")
  const { data } = await client.post<{ accessToken: string }>("/auth/refresh", { refreshToken: refresh })
  setToken(data.accessToken)
  return data.accessToken
}

export function logout(): void {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("currentUser")
  window.location.href = "/login"
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>("/auth/profile")
  return data
}
