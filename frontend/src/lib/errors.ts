import { ApiError } from "@/api/http";

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something unexpected happened. Please try again.";
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound;
}

/** Route params are strings; only positive integers are valid painting IDs. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
