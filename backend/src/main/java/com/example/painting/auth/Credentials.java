package com.example.painting.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request bodies for the auth endpoints, grouped here because they are small and related. */
public final class Credentials {
    private Credentials() {} // only a namespace for the records below; never instantiated

    /** Body of POST /api/auth/login. Only presence and size are checked; correctness is decided by the password check. */
    public record Login(@NotBlank @Size(max = 50) String username, @NotBlank @Size(max = 72) String password) {
    }

    /**
     * Body of POST /api/auth/register. The rules decide what an acceptable new account looks like.
     * BCrypt only uses the first 72 bytes, hence the password cap.
     */
    public record Register(
            @NotBlank @Size(min = 3, max = 50) @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "may contain only letters, digits, '.', '_' and '-'") String username,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }
}
