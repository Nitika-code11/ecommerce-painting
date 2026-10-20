// One function per backend endpoint for paintings. Each validates the response shape before returning it,
// so the rest of the UI can trust the types it receives.
import type { Painting, PaintingInput, PaintingPage } from "@/types/painting";
import { isPainting, isPaintingPage } from "@/validation/paintingValidation";
import { ApiError, request } from "./http";

const BASE = "/api/paintings";

/** Used when the server answered 2xx but with data that doesn't look like what we asked for. */
function invalid(): never {
  throw new ApiError("invalid-data", "The server sent painting data in an unexpected format.");
}

export interface ListParams {
  title?: string;
  /** Zero-based page index; omitted means the first page. */
  page?: number;
}

// The backend (PaintingController.findAll) returns a page envelope; the page size is the server default.
/** GET /api/paintings: one page of the catalogue, optionally filtered by title. */
export async function listPaintings({ title, page }: ListParams = {}, signal?: AbortSignal): Promise<PaintingPage> {
  // URLSearchParams handles URL-encoding (spaces, &, ...) so user input can't break the query string.
  const params = new URLSearchParams();
  if (title?.trim()) params.set("title", title.trim());
  if (page) params.set("page", String(page)); // page 0 is the default, so it is left out
  const query = params.size ? `?${params}` : "";
  const data = await request(`${BASE}${query}`, { signal });
  return isPaintingPage(data) ? data : invalid();
}

/** GET /api/paintings/{id}. Rejects with an ApiError whose isNotFound is true if there is no such painting. */
export async function getPainting(id: number, signal?: AbortSignal): Promise<Painting> {
  const data = await request(`${BASE}/${id}`, { signal });
  return isPainting(data) ? data : invalid();
}

/** POST /api/paintings (administrators only). Resolves with the created painting, including its new id. */
export async function createPainting(input: PaintingInput): Promise<Painting> {
  const data = await request(BASE, { method: "POST", body: JSON.stringify(input) });
  return isPainting(data) ? data : invalid();
}

/** PUT /api/paintings/{id} (administrators only). Replaces all editable fields. */
export async function updatePainting(id: number, input: PaintingInput): Promise<Painting> {
  const data = await request(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return isPainting(data) ? data : invalid();
}

/** DELETE /api/paintings/{id} (administrators only). The server answers 204 with no body. */
export async function deletePainting(id: number): Promise<void> {
  await request(`${BASE}/${id}`, { method: "DELETE" });
}
