// Shared helpers for the tests: sample paintings, fake HTTP responses, a fake sign-in token, and a function
// that renders the whole app at a chosen URL.
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { buildRoutes } from "@/app/router";
import { setToken } from "@/lib/auth";
import type { Painting, PaintingPage } from "@/types/painting";

/** A painting with every field filled in. */
export const sunset: Painting = {
  id: 1,
  title: "Sunset Over Hills",
  artist: "A. Sharma",
  description: "Acrylic on canvas",
  price: 4500,
  stock: 3,
  imageUrl: "https://example.com/sunset.jpg",
};

/** A sold-out painting with no description and no image (exercises the optional-field paths). */
export const harbour: Painting = {
  id: 2,
  title: "Harbour at Dawn",
  artist: "R. Iyer",
  description: null,
  price: 3200.5,
  stock: 0,
  imageUrl: null,
};

/** Builds the backend's page envelope for GET /api/paintings. */
export function pageOf(content: Painting[], overrides: Partial<PaintingPage> = {}): PaintingPage {
  return { content, page: 0, size: 12, totalElements: content.length, totalPages: content.length ? 1 : 0, ...overrides };
}

/** Builds a fake HTTP response carrying JSON, like the backend would send. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A function that decides the fake response for each request, given its URL and options. */
type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/** Replaces global fetch with a handler and returns the mock for assertions. */
export function mockFetch(handler: Handler) {
  const fn = vi.fn((input: RequestInfo | URL, init: RequestInit = {}) =>
    Promise.resolve(handler(String(input), init)),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** JWT-style encoding: JSON turned into URL-safe base64 without padding. */
const base64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** An unsigned look-alike JWT: the UI only reads its claims, the server (mocked here) does the verifying. */
export function makeToken({ username = "boss", roles = ["ADMIN"], expiresInSeconds = 3600 } = {}): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url({ sub: username, roles, exp })}.signature`;
}

/** Who the test is signed in as; null means a guest. */
export type SignedInAs = "ADMIN" | "CUSTOMER" | null;

/** Renders the app at `path`. Tests run as a signed-in administrator unless told otherwise. */
export function renderRoute(path: string, { enableMutations = true, signedInAs = "ADMIN" as SignedInAs } = {}) {
  setToken(signedInAs ? makeToken({ username: signedInAs.toLowerCase(), roles: [signedInAs] }) : null);
  const router = createMemoryRouter(buildRoutes(enableMutations), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
