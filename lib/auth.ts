import { User, users } from "@/data/mock"

export function login(id: string, password: string): User | null {
  const u = users.find(u => u.id === id && u.password === password)
  if (!u) return null
  sessionStorage.setItem("currentUser", JSON.stringify(u))
  return u
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem("currentUser")
  if (!raw) return null
  return JSON.parse(raw) as User
}

export function logout() {
  sessionStorage.removeItem("currentUser")
  window.location.href = "/login"
}