// Fetch wrapper for the Laravel API — attaches the bearer token, parses
// JSON, and normalizes errors to a single `ApiError` shape.

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "jw_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Fired whenever a request comes back 401 — lets the auth context react (e.g. redirect to /login). */
export const UNAUTHORIZED_EVENT = "jw:unauthorized";

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; cache?: RequestCache } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    cache: options.cache,
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body?.error || "Something went wrong.", res.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, opts?: { cache?: RequestCache }) => request<T>(path, { cache: opts?.cache }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ?? {} }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
