import type { Painting, PaintingInput, PaintingPage } from "@/types/painting";

const isOptionalString = (v: unknown) => v === undefined || v === null || typeof v === "string";

/** Runtime check for API data; TypeScript types alone don't validate JSON. */
export function isPainting(data: unknown): data is Painting {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.stock === "number" &&
    Number.isInteger(value.stock) &&
    isOptionalString(value.description) &&
    isOptionalString(value.imageUrl)
  );
}

const isCount = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;

export function isPaintingPage(data: unknown): data is PaintingPage {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    Array.isArray(value.content) &&
    value.content.every(isPainting) &&
    isCount(value.page) &&
    isCount(value.size) &&
    isCount(value.totalElements) &&
    isCount(value.totalPages)
  );
}

/** Raw form values, as typed by the user. */
export interface PaintingFormValues {
  title: string;
  artist: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
}

export type PaintingFormErrors = Partial<Record<keyof PaintingFormValues, string>>;

// Mirrors the backend request constraints (PaintingRequest.java).
export const LIMITS = { title: 150, artist: 120, description: 2000, imageUrl: 1000, minPrice: 0.01 };

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePaintingForm(values: PaintingFormValues): PaintingFormErrors {
  const errors: PaintingFormErrors = {};
  const title = values.title.trim();
  const artist = values.artist.trim();
  const description = values.description.trim();
  const imageUrl = values.imageUrl.trim();

  if (!title) errors.title = "Title is required.";
  else if (title.length > LIMITS.title) errors.title = `Title must be ${LIMITS.title} characters or fewer.`;

  if (!artist) errors.artist = "Artist is required.";
  else if (artist.length > LIMITS.artist) errors.artist = `Artist must be ${LIMITS.artist} characters or fewer.`;

  if (description.length > LIMITS.description)
    errors.description = `Description must be ${LIMITS.description} characters or fewer.`;

  const priceText = values.price.trim();
  const price = Number(priceText);
  if (!priceText) errors.price = "Price is required.";
  else if (!Number.isFinite(price)) errors.price = "Price must be a number.";
  else if (price < LIMITS.minPrice) errors.price = "Price must be greater than zero.";
  else if (!/^\d+(\.\d{1,2})?$/.test(priceText)) errors.price = "Price can have at most two decimal places.";

  const stockText = values.stock.trim();
  const stock = Number(stockText);
  if (!stockText) errors.stock = "Stock is required.";
  else if (!/^\d+$/.test(stockText) || !Number.isSafeInteger(stock)) errors.stock = "Stock must be a whole number of 0 or more.";

  if (imageUrl) {
    if (!isHttpUrl(imageUrl)) errors.imageUrl = "Enter a valid http(s) URL.";
    else if (imageUrl.length > LIMITS.imageUrl) errors.imageUrl = `Image URL must be ${LIMITS.imageUrl} characters or fewer.`;
  }

  return errors;
}

export function toPaintingInput(values: PaintingFormValues): PaintingInput {
  const description = values.description.trim();
  const imageUrl = values.imageUrl.trim();
  return {
    title: values.title.trim(),
    artist: values.artist.trim(),
    price: Number(values.price.trim()),
    stock: Number(values.stock.trim()),
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
}

export function toFormValues(painting?: Painting): PaintingFormValues {
  return {
    title: painting?.title ?? "",
    artist: painting?.artist ?? "",
    description: painting?.description ?? "",
    price: painting ? String(painting.price) : "",
    stock: painting ? String(painting.stock) : "",
    imageUrl: painting?.imageUrl ?? "",
  };
}
