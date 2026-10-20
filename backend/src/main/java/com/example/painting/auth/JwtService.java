package com.example.painting.auth;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Creates the access tokens handed out at login.
 *
 * A JWT is three base64 parts: header.payload.signature. The payload ("claims") is readable by anyone, so it holds
 * only non-secret facts; the signature, made with the server's secret key, is what stops anyone from forging or
 * editing a token. Verification of incoming tokens happens in Spring Security (see SecurityConfig).
 */
@Service
public class JwtService {
    /** Name of the claim holding the user's roles; read back by the authorities converter in SecurityConfig. */
    static final String ROLES_CLAIM = "roles";

    private final JwtEncoder encoder;
    private final Duration ttl;

    public JwtService(JwtEncoder encoder, SecurityProperties properties) {
        this.encoder = encoder;
        this.ttl = properties.jwt().ttl();
    }

    /** Builds and signs a token for the given account that is valid for the configured lifetime. */
    public TokenResponse issue(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getUsername())           // "sub": who the token is about
                .issuedAt(now)                          // "iat": when it was created
                .expiresAt(now.plus(ttl))               // "exp": after this the token is rejected
                .claim(ROLES_CLAIM, List.of(user.getRole().name())) // e.g. ["ADMIN"]
                .build();
        // HS256 = HMAC-SHA-256 signature using the shared secret.
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return TokenResponse.bearer(token, ttl.toSeconds());
    }
}
