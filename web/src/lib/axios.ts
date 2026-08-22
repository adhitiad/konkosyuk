import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// R-3 note: axios dipertahankan karena:
// 1. apiClient memakai interceptor request/response untuk CSRF token injection, error normalization, dan 401 handling
// 2. Payment gateway modules (doku, ipaymu, nicepay, gateway-manager) memakai axios instance khusus dengan timeout dan error typing
// 3. 20+ komponen/hooks bergantung pada apiClient/publicClient — migrasi ke fetch native berisiko tinggi dan membutuhkan rewrite interceptor
let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  return csrfToken;
}

export async function ensureCsrfToken(): Promise<void> {
  if (csrfToken) return;
  const response = await fetch("/api/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Failed to initialize CSRF token");
  const data = (await response.json()) as { token?: string };
  if (data.token) csrfToken = data.token;
  if (!csrfToken) throw new Error("CSRF token cookie is not available after initialization");
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method = (init.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfToken();
    const headers = new Headers(init.headers);
    const token = getCsrfToken();
    if (token) headers.set("X-CSRF-Token", token);
    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials || "same-origin",
    });
  }
  return fetch(input, init);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (
      config.method &&
      ["post", "patch", "delete", "put"].includes(config.method.toLowerCase())
    ) {
      await ensureCsrfToken();
    }
    const csrfToken = getCsrfToken();
    if (
      csrfToken &&
      config.method &&
      ["post", "patch", "delete", "put"].includes(config.method.toLowerCase())
    ) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const publicClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 30000,
});
