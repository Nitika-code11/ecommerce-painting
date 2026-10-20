package com.example.painting.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Typed view of the {@code app.security.*} settings in application.yml. Spring fills the records from the
 * configuration, and the constructors below validate them, so a bad configuration stops the app at startup
 * instead of failing later at runtime.
 *
 * The JWT secret has no default outside the dev profile, so a deployment without {@code APP_JWT_SECRET}
 * fails immediately instead of silently using a known key.
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(Jwt jwt, BootstrapAdmin bootstrapAdmin) {

    /** Token signing settings. */
    public record Jwt(String secret, Duration ttl) {
        public Jwt {
            // HS256 needs a key of at least 256 bits (32 bytes) to be considered safe.
            if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
                throw new IllegalStateException("app.security.jwt.secret must be at least 32 bytes (set APP_JWT_SECRET).");
            }
            if (ttl == null) ttl = Duration.ofMinutes(60); // default lifetime of an access token
        }
    }

    /** Optional first administrator, created at startup when no account with that name exists. */
    public record BootstrapAdmin(String username, String password) {
        /** True only when both values are present; otherwise no admin is created. */
        boolean configured() {
            return username != null && !username.isBlank() && password != null && !password.isBlank();
        }
    }
}
