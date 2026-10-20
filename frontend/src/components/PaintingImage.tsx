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
  // Remember which URL failed, so a different src (e.g. after an edit) gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy" // don't download images far below the viewport until they are about to be seen
          referrerPolicy="no-referrer" // don't tell the image host which page the request came from
          onError={() => setFailedSrc(src)} // broken link / blocked image: switch to the placeholder
          // Fill the box; the image zooms slightly when the surrounding card ("group") is hovered.
          className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        // role="img" + aria-label makes the placeholder announce itself like an image with a description.
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
