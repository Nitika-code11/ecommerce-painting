import type { Painting, PaintingInput, PaintingPage } from "@/types/painting";
import { isPainting, isPaintingPage } from "@/validation/paintingValidation";
import { ApiError, request } from "./http";

const BASE = "/api/paintings";

function invalid(): never {
  throw new ApiError("invalid-data", "The server sent painting data in an unexpected format.");
}

export interface ListParams {
  title?: string;
  /** Zero-based page index; omitted means the first page. */
  page?: number;
}

// The backend (PaintingController.findAll) returns a page envelope; the page size is the server default.
export async function listPaintings({ title, page }: ListParams = {}, signal?: AbortSignal): Promise<PaintingPage> {
  const params = new URLSearchParams();
  if (title?.trim()) params.set("title", title.trim());
  if (page) params.set("page", String(page));
  const query = params.size ? `?${params}` : "";
  const data = await request(`${BASE}${query}`, { signal });
  return isPaintingPage(data) ? data : invalid();
}

export async function getPainting(id: number, signal?: AbortSignal): Promise<Painting> {
  const data = await request(`${BASE}/${id}`, { signal });
  return isPainting(data) ? data : invalid();
}

export async function createPainting(input: PaintingInput): Promise<Painting> {
  const data = await request(BASE, { method: "POST", body: JSON.stringify(input) });
  return isPainting(data) ? data : invalid();
}

export async function updatePainting(id: number, input: PaintingInput): Promise<Painting> {
  const data = await request(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return isPainting(data) ? data : invalid();
}

export async function deletePainting(id: number): Promise<void> {
  await request(`${BASE}/${id}`, { method: "DELETE" });
}
