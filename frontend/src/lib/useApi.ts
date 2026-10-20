import { useCallback, useEffect, useState } from "react";

export type ApiState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: unknown };

/** Runs an abortable request whenever `deps` change; exposes a retry. */
export function useApi<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    load(controller.signal).then(
      (data) => !controller.signal.aborted && setState({ status: "success", data }),
      (error) => !controller.signal.aborted && setState({ status: "error", error }),
    );
    return () => controller.abort();
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
