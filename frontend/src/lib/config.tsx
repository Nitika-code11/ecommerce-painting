import { createContext, useContext } from "react";

/** Create/edit/delete are on unless explicitly disabled for this environment (VITE_ENABLE_MUTATIONS=false). */
export const mutationsEnabled = import.meta.env.VITE_ENABLE_MUTATIONS !== "false";

// A React context lets any component read this flag without passing it through every level as a prop.
const MutationsContext = createContext(mutationsEnabled);

/** Wrap part of the tree in this to set the flag for everything below (the router does it; tests override it). */
export const MutationsProvider = MutationsContext.Provider;

/** Hook: is management (sign-in, create, edit, delete) enabled in this environment? */
export function useMutationsEnabled(): boolean {
  return useContext(MutationsContext);
}
