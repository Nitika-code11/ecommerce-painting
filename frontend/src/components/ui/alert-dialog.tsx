// A confirmation dialog ("Are you sure?") built on Radix UI's AlertDialog, which provides the hard parts:
// focus is trapped inside the dialog, Escape closes it, and screen readers announce it correctly.
// The components below only add our styling.
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/** The root: holds the open/closed state. */
export const AlertDialog = AlertDialogPrimitive.Root;
/** The element (usually a button) that opens the dialog when clicked. */
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/** The dialog box itself, centred on screen over a dimmed backdrop. */
export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    // Portal renders the dialog at the end of <body>, so parent styles/overflow can't clip it.
    // (Keep only elements as its children: Radix wraps each child, and a stray text node or JSX comment breaks it.)
    <AlertDialogPrimitive.Portal>
      {/* Overlay = the dimmed backdrop behind the dialog. */}
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-card p-6 shadow-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

/** Container for the title and description. */
export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />;
}

/** Container for the buttons; stacked on phones, side by side on larger screens. */
export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

/** The dialog's heading (also what screen readers read first). */
export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn("font-serif text-lg font-semibold", className)} {...props} />;
}

/** The explanatory text under the title. */
export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** The confirming button, styled as a destructive (red) button. */
export function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant: "destructive" }), className)} {...props} />;
}

/** The cancelling button, styled as an outline button; closes the dialog without doing anything. */
export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
}
