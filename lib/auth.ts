import { User } from "@/data/mock"

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