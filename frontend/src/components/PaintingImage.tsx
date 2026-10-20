import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaintingImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/** Shows the painting's image, or a neutral placeholder when it is missing or fails to load. */
export function PaintingImage({ src, alt, className }: PaintingImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (no image available)`}
          className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <ImageOff aria-hidden="true" className="size-8" />
          <span className="text-xs">No image available</span>
        </div>
      )}
    </div>
  );
}
