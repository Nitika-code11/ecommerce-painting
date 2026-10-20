import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The button's look, defined once. `cva` (class-variance-authority) combines a base set of Tailwind classes
// with the classes of whichever "variant" (colour style) and "size" is requested.
const buttonVariants = cva(
  // Base classes shared by every button: layout, text, focus ring, disabled look, and a fixed size for inline icons.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90", // main action
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90", // dangerous action (delete)
        outline: "border border-input bg-card shadow-sm hover:bg-accent hover:text-accent-foreground", // secondary action
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground", // low-emphasis, e.g. in the header
        link: "text-primary underline-offset-4 hover:underline", // looks like a text link
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-6",
        icon: "size-10", // square, for icon-only buttons
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, the button's styles are applied to its child element (e.g. a router <Link>) instead of a <button>. */
  asChild?: boolean;
}

/** A styled button. All normal button props (onClick, disabled, type...) work as usual. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Slot (from Radix) merges our props onto the single child, which keeps links semantically links.
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button"; // readable name in React dev tools

export { buttonVariants };
