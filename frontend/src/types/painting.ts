export interface Painting {
  id: number;
  title: string;
  artist: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

export interface PaintingInput {
  title: string;
  artist: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
