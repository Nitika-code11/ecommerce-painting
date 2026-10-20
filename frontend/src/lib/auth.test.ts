// Tests of the client-side token handling: decoding a JWT's claims (without trusting it as proof of anything),
// rejecting malformed or expired tokens, and the sessionStorage-backed token store.
import { describe, expect, it } from "vitest";
import { makeToken } from "@/test/utils";
import { clearToken, getToken, parseToken, setToken } from "./auth";

describe("parseToken", () => {
  it("reads the username, roles and expiry from a token", () => {
    const user = parseToken(makeToken({ username: "asha", roles: ["CUSTOMER"], expiresInSeconds: 600 }));
    expect(user).toMatchObject({ username: "asha", roles: ["CUSTOMER"] });
    expect(user!.expiresAt).toBeGreaterThan(Date.now());
  });

  it("rejects expired tokens", () => {
    expect(parseToken(makeToken({ expiresInSeconds: -5 }))).toBeNull();
  });

  it.each([
    ["an empty string", ""],
    ["no payload section", "abc"],
    ["a payload that is not base64 JSON", "a.%%%.c"],
    ["a payload that is not an object", `a.${btoa("123")}.c`],
    ["a payload without sub/exp", `a.${btoa(JSON.stringify({ roles: ["ADMIN"] }))}.c`],
  ])("rejects %s", (_label, raw) => {
    expect(parseToken(raw)).toBeNull();
  });

  it("ignores non-string roles", () => {
    const payload = btoa(JSON.stringify({ sub: "x", exp: Math.floor(Date.now() / 1000) + 60, roles: ["ADMIN", 7, null] }));
    expect(parseToken(`a.${payload}.c`)?.roles).toEqual(["ADMIN"]);
  });
});

describe("token store", () => {
  it("stores, returns and clears a token, and keeps it in sessionStorage", () => {
    const token = makeToken();
    setToken(token);
    expect(getToken()).toBe(token);
    expect(window.sessionStorage.getItem("painting.accessToken")).toBe(token);

    clearToken();
    expect(getToken()).toBeNull();
    expect(window.sessionStorage.getItem("painting.accessToken")).toBeNull();
  });

  it("drops an expired token instead of returning it", () => {
    setToken(makeToken({ expiresInSeconds: -1 }));
    expect(getToken()).toBeNull();
    expect(window.sessionStorage.getItem("painting.accessToken")).toBeNull();
  });
});
