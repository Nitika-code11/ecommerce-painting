import * as React from "react";
import { cn } from "@/lib/utils";

/** A styled text input. Accepts every normal <input> prop; `aria-invalid` turns the border red. */
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref} // forwarded so parents (e.g. the form) can focus the field
      className={cn(
        // Full-width box with border, padding, placeholder colour, focus ring, disabled look and error state.
        // text-base on small screens avoids iOS Safari zooming in on focus; md:text-sm on larger ones.
        "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
