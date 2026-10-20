package com.example.painting.auth;

/** Thrown when signing up with a username that exists already; GlobalExceptionHandler maps it to 409 Conflict. */
public class UsernameTakenException extends RuntimeException {
    public UsernameTakenException(String username) {
        super("Username already taken: " + username);
    }
}
