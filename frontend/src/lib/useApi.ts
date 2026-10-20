import { useCallback, useEffect, useState } from "react";

/** The three states of a request, as a discriminated union: `status` tells TypeScript which other fields exist. */
export type ApiState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: unknown };

/** Runs an abortable request whenever `deps` change; exposes a retry. */
export function useApi<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });
  // Bumping this number re-runs the effect, which is how "Try again" works.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // An AbortController lets us cancel the request if the page changes before it finishes.
    const controller = new AbortController();
    setState({ status: "loading" });
    load(controller.signal).then(
      // Ignore late answers from a request that was already cancelled (prevents showing stale data).
      (data) => !controller.signal.aborted && setState({ status: "success", data }),
      (error) => !controller.signal.aborted && setState({ status: "error", error }),
    );
    return () => controller.abort(); // cleanup: cancel on dependency change or when the component unmounts
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
