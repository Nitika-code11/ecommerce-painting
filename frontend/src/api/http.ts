// Low-level HTTP helper used by every API call: adds the sign-in token, turns failures into one error type
// with safe messages, and returns the parsed JSON as `unknown` so callers must validate it before use.
import { clearToken, getToken } from "@/lib/auth";

/** What kind of failure happened: no connection, an HTTP error status, or a response we couldn't understand. */
export type ApiErrorKind = "network" | "http" | "invalid-data";

/** The only error type the UI deals with. Its message is always safe to show to a visitor. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status code, for kind === "http". */
  readonly status?: number;
  /** Per-field messages from a 400 response, e.g. { title: "must not be blank" }. */
  readonly fieldErrors?: Record<string, string>;

  constructor(kind: ApiErrorKind, message: string, options: { status?: number; fieldErrors?: Record<string, string> } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
  }

  /** Convenience: true for "that painting doesn't exist" (HTTP 404). */
  get isNotFound() {
    return this.kind === "http" && this.status === 404;
  }
}

// Backend origin. Empty in development (the Vite proxy handles /api); set at build time for production.
// Trailing slashes are removed so "https://api.example.com/" and "https://api.example.com" behave the same.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/** Prefixes a path like "/api/paintings" with the backend origin. */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/** Friendly, non-technical wording for each failure status. The server's own text is never shown to visitors. */
function messageForStatus(status: number): string {
  if (status === 400) return "Some of the details were not accepted. Please check the form and try again.";
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409) return "That change conflicts with the current data. Refresh and try again.";
  if (status >= 500) return "The server ran into a problem. Please try again later.";
  return `The request failed (status ${status}).`;
}

/** Extracts field errors if the backend sends the spec's error shape; ignores anything else. */
async function readFieldErrors(response: Response): Promise<Record<string, string> | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return undefined;
    const fieldErrors = (body as Record<string, unknown>).fieldErrors;
    if (typeof fieldErrors !== "object" || fieldErrors === null) return undefined;
    // Keep only string values: the body comes from outside, so nothing in it is trusted.
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (typeof value === "string") result[key] = value;
    }
    return Object.keys(result).length ? result : undefined;
  } catch {
    return undefined; // not JSON: just no field errors
  }
}

export interface RequestOptions {
  /** Attach the signed-in user's token. Off for sign-in itself. Default true. */
  auth?: boolean;
}

/**
 * Performs a request and returns the parsed JSON body as `unknown` (or `undefined`
 * for empty responses). Callers must validate the shape before trusting it.
 */
export async function request(path: string, init: RequestInit = {}, { auth = true }: RequestOptions = {}): Promise<unknown> {
  // The token (if any, and not expired) goes in the standard Authorization header.
  const bearer = auth ? getToken() : null;
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}), // only requests with a body declare JSON
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch rejects only when no response arrived at all (offline, server down, blocked).
    throw new ApiError("network", "Couldn't reach the server. Check your connection and that the backend is running.");
  }

  if (response.status === 401 && bearer) {
    // The server no longer accepts our token (expired, or the signing key changed): drop it.
    clearToken();
    // Reading the catalogue is public, so a stale token must not break it: retry once as a guest.
    if (!init.method || init.method === "GET") return request(path, init, { auth: false });
  }

  if (!response.ok) {
    // Only a 400 can carry per-field messages worth showing next to form inputs.
    const fieldErrors = response.status === 400 ? await readFieldErrors(response) : undefined;
    throw new ApiError("http", messageForStatus(response.status), { status: response.status, fieldErrors });
  }

  if (response.status === 204) return undefined; // "No Content", e.g. after DELETE
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    // Success status but not JSON (e.g. an HTML error page from a proxy): empty is fine, anything else is wrong.
    const text = await response.text();
    if (!text) return undefined;
    throw new ApiError("invalid-data", "The server sent a response we couldn't read.");
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ApiError("invalid-data", "The server sent a response we couldn't read.");
  }
}
