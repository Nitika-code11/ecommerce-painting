package com.example.painting.auth;

/** Public view of an account returned after sign-up; deliberately has no password or hash field. */
public record RegisteredUser(String username, Role role) {
}
