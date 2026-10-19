import { createContext, useContext } from "react";

/** Create/edit/delete are on unless explicitly disabled for this environment. */
export const mutationsEnabled = import.meta.env.VITE_ENABLE_MUTATIONS !== "false";

const MutationsContext = createContext(mutationsEnabled);

export const MutationsProvider = MutationsContext.Provider;

export function useMutationsEnabled(): boolean {
  return useContext(MutationsContext);
}
