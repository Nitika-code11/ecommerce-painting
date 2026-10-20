import { Loader2 } from "lucide-react";

/** Spinner plus text shown while a request is in flight. role="status" lets screen readers announce it politely. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
