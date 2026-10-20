// Sign-in call. (Account creation exists on the server, but the UI has no sign-up screen yet.)
import { ApiError, request } from "./http";

/** Exchanges credentials for an access token. Never sends (or needs) an existing token. */
export async function login(username: string, password: string): Promise<string> {
  // { auth: false }: do not attach a stored token. A stale one would make the server reject even this public call.
  const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }, { auth: false });
  // Check the shape instead of trusting it: we need a non-empty string called accessToken.
  const token = typeof data === "object" && data !== null ? (data as Record<string, unknown>).accessToken : undefined;
  if (typeof token !== "string" || !token) {
    throw new ApiError("invalid-data", "The server sent a sign-in response in an unexpected format.");
  }
  return token;
}
