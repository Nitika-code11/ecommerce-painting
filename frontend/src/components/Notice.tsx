import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Shows a one-off confirmation passed through router state ({ notice: "…" })
 * after a successful create, update or delete.
 */
export function Notice() {
  const location = useLocation();
  const navigate = useNavigate();
  // Router state is untyped, so check it really is a string before showing it.
  const notice = (location.state as { notice?: unknown } | null)?.notice;
  const message = typeof notice === "string" ? notice : null;

  // Dismissing = navigating to the same URL with the state cleared (replace: no extra history entry).
  const dismiss = () => navigate(location.pathname + location.search, { replace: true, state: null });

  // Hide the message by itself after six seconds.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(dismiss, 6000);
    return () => window.clearTimeout(timer); // cancel the timer if the message changes or the component goes away
  }, [message]);

  if (!message) return null;
  return (
    <div role="status" className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
      <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-primary" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss message"
        className="rounded p-1 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
