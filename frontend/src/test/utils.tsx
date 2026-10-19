import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { buildRoutes } from "@/app/router";
import type { Painting } from "@/types/painting";

export const sunset: Painting = {
  id: 1,
  title: "Sunset Over Hills",
  artist: "A. Sharma",
  description: "Acrylic on canvas",
  price: 4500,
  stock: 3,
  imageUrl: "https://example.com/sunset.jpg",
};

export const harbour: Painting = {
  id: 2,
  title: "Harbour at Dawn",
  artist: "R. Iyer",
  description: null,
  price: 3200.5,
  stock: 0,
  imageUrl: null,
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/** Replaces global fetch with a handler and returns the mock for assertions. */
export function mockFetch(handler: Handler) {
  const fn = vi.fn((input: RequestInfo | URL, init: RequestInit = {}) =>
    Promise.resolve(handler(String(input), init)),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

export function renderRoute(path: string, { enableMutations = true } = {}) {
  const router = createMemoryRouter(buildRoutes(enableMutations), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
