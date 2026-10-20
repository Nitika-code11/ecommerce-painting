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

export interface PaintingInput {
  title: string;
  artist: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
