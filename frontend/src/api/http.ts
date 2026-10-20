export type ApiErrorKind = "network" | "http" | "invalid-data";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(kind: ApiErrorKind, message: string, options: { status?: number; fieldErrors?: Record<string, string> } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
  }

  get isNotFound() {
    return this.kind === "http" && this.status === 404;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

function messageForStatus(status: number): string {
  if (status === 400) return "Some of the details were not accepted. Please check the form and try again.";
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
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (typeof value === "string") result[key] = value;
    }
    return Object.keys(result).length ? result : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Performs a request and returns the parsed JSON body as `unknown` (or `undefined`
 * for empty responses). Callers must validate the shape before trusting it.
 */
export async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("network", "Couldn't reach the server. Check your connection and that the backend is running.");
  }

  if (!response.ok) {
    const fieldErrors = response.status === 400 ? await readFieldErrors(response) : undefined;
    throw new ApiError("http", messageForStatus(response.status), { status: response.status, fieldErrors });
  }

  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
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
