package com.example.painting.auth;

/**
 * Result of a successful login, in the standard OAuth2 token-response shape.
 *
 * @param accessToken the signed JWT to send as {@code Authorization: Bearer <token>}
 * @param tokenType   always "Bearer"
 * @param expiresIn   lifetime of the token in seconds
 */
public record TokenResponse(String accessToken, String tokenType, long expiresIn) {
    public static TokenResponse bearer(String accessToken, long expiresIn) {
        return new TokenResponse(accessToken, "Bearer", expiresIn);
    }
}
