import { useMemo, useSyncExternalStore } from "react";
import { useMutationsEnabled } from "@/lib/config";

/**
 * The access token lives in sessionStorage: it survives a refresh but not a closed tab, and is never sent
 * anywhere except the API as a Bearer header. The server is the authority on roles; what we decode here only
 * decides which controls to show.
 */
const STORAGE_KEY = "painting.accessToken";

export interface AuthUser {
  username: string;
  roles: string[];
  /** Expiry as epoch milliseconds. */
  expiresAt: number;
}

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked: the session just won't survive a refresh
  }
}

function persist(value: string | null) {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, value);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Reads the claims of a JWT without verifying it. Returns null if it is malformed or already expired. */
export function parseToken(raw: string, now = Date.now()): AuthUser | null {
  try {
    const payload = raw.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (typeof claims !== "object" || claims === null) return null;
    const { sub, exp, roles } = claims as Record<string, unknown>;
    if (typeof sub !== "string" || typeof exp !== "number") return null;
    const expiresAt = exp * 1000;
    if (expiresAt <= now) return null;
    return {
      username: sub,
      roles: Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [],
      expiresAt,
    };
  } catch {
    return null;
  }
}

// The token lives in module-level state (plus sessionStorage) rather than React state, so non-React code such as
// the HTTP helper can read it too. React components subscribe to changes through useSyncExternalStore below.
let token: string | null = readStored();
const listeners = new Set<() => void>();

/** Lets React register to be told when the token changes (sign in / sign out / expiry). */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current token, or null if there is none or it has expired. */
export function getToken(): string | null {
  if (token && !parseToken(token)) setToken(null);
  return token;
}

/** Stores a new token (or null to sign out), saves it for page refreshes, and notifies every subscribed component. */
export function setToken(next: string | null) {
  token = next;
  persist(next);
  listeners.forEach((listener) => listener());
}

/** Signs out locally. The server keeps no session, so there is nothing to call. */
export function clearToken() {
  setToken(null);
}

/** Hook: who is signed in? `user` is null for guests; `isAdmin` is true when the token carries the ADMIN role. */
export function useAuth() {
  // Re-renders the component whenever the token changes; the third argument is the server-render fallback.
  const raw = useSyncExternalStore(subscribe, () => token, () => null);
  // Decode only when the token string changes, not on every render.
  const user = useMemo(() => (raw ? parseToken(raw) : null), [raw]);
  return { user, isAdmin: user?.roles.includes("ADMIN") ?? false };
}

/** Create/edit/delete controls: enabled for this environment AND the signed-in user is an administrator. */
export function useCanManage(): boolean {
  const mutationsEnabled = useMutationsEnabled();
  const { isAdmin } = useAuth();
  return mutationsEnabled && isAdmin;
}
