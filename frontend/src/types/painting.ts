// Shapes of the data exchanged with the backend (they mirror PaintingResponse / PaintingRequest in the API).

/** A painting as returned by the API. */
export interface Painting {
  id: number;
  title: string;
  artist: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

/** One page of the catalogue, as returned by GET /api/paintings. `page` is zero-based. */
export interface PaintingPage {
  content: Painting[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** What the UI sends when creating or replacing a painting (no id: the server assigns it). */
export interface PaintingInput {
  title: string;
  artist: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
