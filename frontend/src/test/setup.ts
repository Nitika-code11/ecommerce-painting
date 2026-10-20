// Runs once before every test file (see `setupFiles` in vite.config.ts).
// Adds the readable DOM assertions (toBeInTheDocument, toHaveFocus...) and resets shared state between tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { clearToken } from "@/lib/auth";

// jsdom does not implement scrolling; pagination scrolls to the top.
window.scrollTo = vi.fn();

// After every test:
afterEach(() => {
  cleanup();    // remove rendered components from the simulated page
  clearToken(); // forget any sign-in, so tests can't leak a session into each other
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
