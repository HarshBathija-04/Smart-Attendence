import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5128").replace(/\/$/, "");
const TOKEN_KEY = "sa_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
};

// --- Cold-start detection: free Render instances sleep and take 30-60s to wake. ---
const SLOW_AFTER_MS = 3500;
let slowRequests = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const wakeStore = {
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  isWaking: () => slowRequests > 0,
};
export const useServerWaking = () => useSyncExternalStore(wakeStore.subscribe, wakeStore.isWaking);

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    slowRequests++;
    emit();
  }, SLOW_AFTER_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
    if (slow) {
      slowRequests--;
      emit();
    }
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && path !== "/api/auth/login") {
      tokenStore.set(null);
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.details);
  }
  return data as T;
}

/** Fetches `path` (skips when null) and exposes loading/error/reload. */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data?: T; error?: ApiError; loading: boolean }>({ loading: !!path });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect a new request immediately
    setState((s) => ({ ...s, loading: true, error: undefined }));
    api<T>(path, { signal: ctrl.signal })
      .then((data) => setState({ data, loading: false }))
      .catch((error) => {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, error, loading: false }));
      });
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

export const qs = (params: Record<string, string | undefined | null>) => {
  const entries = Object.entries(params).filter((e): e is [string, string] => !!e[1]);
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
};
