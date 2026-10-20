import { Link } from "react-router-dom";
import type { Painting } from "@/types/painting";
import { formatPrice } from "@/lib/format";
import { PaintingImage } from "./PaintingImage";
import { StockBadge } from "./StockBadge";

export function PaintingCard({ painting }: { painting: Painting }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-ring hover:-translate-y-1 hover:shadow-xl">
      <PaintingImage src={painting.imageUrl} alt={painting.title} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="text-lg font-semibold leading-snug">
          <Link to={`/paintings/${painting.id}`} className="outline-none after:absolute after:inset-0">
            {painting.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">by {painting.artist}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-semibold">{formatPrice(painting.price)}</span>
          <StockBadge stock={painting.stock} />
        </div>
      </div>
    </article>
  );
}
