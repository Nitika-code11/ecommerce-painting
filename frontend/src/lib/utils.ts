import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Builds a CSS class string from several inputs: clsx joins them and drops falsy values, and twMerge resolves
 * conflicting Tailwind classes (e.g. "px-2 px-4" becomes "px-4"), so a caller's className can override defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
