import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios"

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

let csrfRequest: Promise<void> | null = null

export async function ensureCsrfToken(): Promise<void> {
  if (getCsrfToken()) return
  csrfRequest ??= fetch('/api/csrf', { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error('Failed to initialize CSRF token')
    })
    .finally(() => { csrfRequest = null })
  await csrfRequest
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await ensureCsrfToken()
    const headers = new Headers(init.headers)
    const token = getCsrfToken()
    if (token) headers.set('X-CSRF-Token', token)
    return fetch(input, { ...init, headers, credentials: init.credentials || 'same-origin' })
  }
  return fetch(input, init)
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.method && ['post', 'patch', 'delete', 'put'].includes(config.method.toLowerCase())) {
      await ensureCsrfToken()
    }
    const csrfToken = getCsrfToken()
    if (csrfToken && config.method && ['post', 'patch', 'delete', 'put'].includes(config.method.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export const publicClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 30000,
})
