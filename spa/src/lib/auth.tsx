import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setToken, getToken, UNAUTHORIZED_EVENT } from "./api";

export type Role = "admin" | "employee" | "customer";

export interface Session {
  role: Role;
  id: number | null;
  name: string | null;
}

const SESSION_KEY = "jw_session";

/** The bearer token's payload is just base64url JSON — safe to read client-side (not
 * verified here, but it was only ever accepted because the server issued it to us). */
function decodeTokenPayload(token: string): { id: number | null; name: string | null } | null {
  try {
    const [payloadB64] = token.split(".");
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payloadB64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return { id: payload.id ?? null, name: payload.name ?? null };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<{ role: Role; redirect: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): Session | null {
  if (!getToken()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onUnauthorized() {
      setToken(null);
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      async login(phone: string, password: string) {
        setLoading(true);
        try {
          const body = await api.post<{ ok: true; role: Role; redirect: string; token: string }>("/login", {
            phone: phone.trim(),
            password,
          });
          setToken(body.token);
          const decoded = decodeTokenPayload(body.token);
          const next: Session = { role: body.role, id: decoded?.id ?? null, name: decoded?.name ?? null };
          localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          setSession(next);
          return { role: body.role, redirect: body.redirect };
        } finally {
          setLoading(false);
        }
      },
      async logout() {
        try {
          await api.post("/logout");
        } catch {
          // Stateless tokens — logout always succeeds locally even if the request fails.
        }
        setToken(null);
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
