import { ApiError } from "@/api/http";

/** Turns any thrown value into text that is safe to show: ApiError messages are, anything else gets a generic line. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something unexpected happened. Please try again.";
}

/** True when the error means "that resource does not exist" (HTTP 404). */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound;
}

/** Route params are strings; only positive integers are valid painting IDs. */
export function parseId(raw: string | undefined): number | null {
  // The regex rejects "abc", "1.5", "-3" and "" before converting.
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  // isSafeInteger rejects numbers too large to represent exactly; 0 is not a valid id either.
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
