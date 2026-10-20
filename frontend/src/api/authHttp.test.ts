// Tests of how the HTTP helper treats the sign-in token (attach it, drop it when rejected, retry reads as a guest)
// and of the login call. fetch is replaced by a fake whose answers each test controls.
import { describe, expect, it } from "vitest";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { jsonResponse, makeToken, mockFetch, pageOf, sunset } from "@/test/utils";
import { login } from "./authApi";
import { createPainting, listPaintings } from "./paintingsApi";

// Reads the Authorization header out of the options a fake fetch call received (undefined when none was sent).
const authHeader = (init?: RequestInit) => (init?.headers as Record<string, string> | undefined)?.Authorization;

describe("bearer token handling", () => {
  it("sends no Authorization header when signed out", async () => {
    const fetchMock = mockFetch(() => jsonResponse(pageOf([])));
    await listPaintings();
    expect(authHeader(fetchMock.mock.calls[0][1])).toBeUndefined();
  });

  it("sends the token on every API call when signed in", async () => {
    const token = makeToken();
    setToken(token);
    const fetchMock = mockFetch(() => jsonResponse(pageOf([])));
    await listPaintings();
    expect(authHeader(fetchMock.mock.calls[0][1])).toBe(`Bearer ${token}`);
  });

  it("drops a rejected token and retries a read as a guest", async () => {
    setToken(makeToken());
    const fetchMock = mockFetch((_url, init) =>
      authHeader(init) ? jsonResponse({ status: 401 }, 401) : jsonResponse(pageOf([sunset])),
    );

    await expect(listPaintings()).resolves.toMatchObject({ content: [sunset] });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authHeader(fetchMock.mock.calls[1][1])).toBeUndefined();
    expect(getToken()).toBeNull();
  });

  it("drops a rejected token on a write but does not replay it, and asks the user to sign in", async () => {
    setToken(makeToken());
    const fetchMock = mockFetch(() => jsonResponse({ status: 401 }, 401));

    await expect(createPainting({ title: "x", artist: "y", price: 1, stock: 1 })).rejects.toMatchObject({
      status: 401,
      message: "Please sign in to continue.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
  });

  it("explains a 403", async () => {
    setToken(makeToken({ roles: ["CUSTOMER"] }));
    mockFetch(() => jsonResponse({ status: 403 }, 403));

    await expect(createPainting({ title: "x", artist: "y", price: 1, stock: 1 })).rejects.toMatchObject({
      status: 403,
      message: "You don't have permission to do that.",
    });
    expect(getToken()).not.toBeNull(); // a 403 is about permissions, not about the token
  });
});

describe("login", () => {
  it("posts the credentials without any existing token and returns the access token", async () => {
    setToken(makeToken({ username: "stale" }));
    const fetchMock = mockFetch(() => jsonResponse({ accessToken: "the.jwt.value", tokenType: "Bearer", expiresIn: 3600 }));

    await expect(login("asha", "pw")).resolves.toBe("the.jwt.value");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(init).toMatchObject({ method: "POST", body: JSON.stringify({ username: "asha", password: "pw" }) });
    expect(authHeader(init)).toBeUndefined();
    clearToken();
  });

  it("rejects a response without an access token", async () => {
    mockFetch(() => jsonResponse({ tokenType: "Bearer" }));
    await expect(login("asha", "pw")).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("does not wipe the session when sign-in itself fails with 401", async () => {
    const token = makeToken();
    setToken(token);
    mockFetch(() => jsonResponse({ status: 401, message: "Invalid username or password" }, 401));

    await expect(login("asha", "wrong")).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBe(token);
  });
});
