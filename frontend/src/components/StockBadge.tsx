import { cn } from "@/lib/utils";

/** Stock status as text plus colour, so it never relies on colour alone. */
export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const label = stock === 0 ? "Sold out" : stock <= 2 ? `Only ${stock} left` : `${stock} in stock`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        stock === 0
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
