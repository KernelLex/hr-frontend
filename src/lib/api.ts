import axios from "axios"

const BASE = import.meta.env.VITE_API_BASE ?? ""

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

export function apiMethod(method: string) {
  return `${BASE}/api/method/${method}`
}
