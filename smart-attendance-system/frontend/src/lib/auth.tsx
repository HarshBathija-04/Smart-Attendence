import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  status: "checking" | "signed-in" | "signed-out";
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>(() => (tokenStore.get() ? "checking" : "signed-out"));

  useEffect(() => {
    if (status !== "checking") return;
    api<{ user: User }>("/api/auth/me")
      .then(({ user }) => {
        setUser(user);
        setStatus("signed-in");
      })
      .catch(() => {
        tokenStore.set(null);
        setStatus("signed-out");
      });
  }, [status]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus("signed-out");
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    tokenStore.set(res.token);
    setUser(res.user);
    setStatus("signed-in");
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setStatus("signed-out");
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
