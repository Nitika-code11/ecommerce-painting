import type { Painting, PaintingInput } from "@/types/painting";
import { isPainting, isPaintingArray } from "@/validation/paintingValidation";
import { ApiError, request } from "./http";

const BASE = "/api/paintings";

function invalid(): never {
  throw new ApiError("invalid-data", "The server sent painting data in an unexpected format.");
}

// The backend (PaintingController.findAll) returns a raw JSON array.
export async function listPaintings(title?: string, signal?: AbortSignal): Promise<Painting[]> {
  const query = title?.trim() ? `?title=${encodeURIComponent(title.trim())}` : "";
  const data = await request(`${BASE}${query}`, { signal });
  return isPaintingArray(data) ? data : invalid();
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
