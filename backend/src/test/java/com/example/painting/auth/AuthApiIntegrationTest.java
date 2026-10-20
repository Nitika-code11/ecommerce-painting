package com.example.painting.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real sign-up and sign-in, then using the issued tokens against the protected endpoints.
 * Unlike PaintingSecurityTest these tests do not fake the user: they register accounts, log in, and send the
 * real JWT in an Authorization header, so they exercise password hashing, token signing and token verification.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiIntegrationTest {
    private static final String PAINTING = """
            {"title":"Sunset","artist":"A. Sharma","price":4500.00,"stock":3}""";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtEncoder jwtEncoder;

    /** Start each test with no accounts. */
    @BeforeEach
    void clean() {
        users.deleteAll();
    }

    // ---- helpers ------------------------------------------------------------------------------------

    /** POST /api/auth/register with the given credentials. */
    private ResultActions register(String username, String password) throws Exception {
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Credentials.Register(username, password))));
    }

    /** POST /api/auth/login with the given credentials. */
    private ResultActions login(String username, String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Credentials.Login(username, password))));
    }

    /** Logs in (expecting success) and returns the access token string. */
    private String tokenFor(String username, String password) throws Exception {
        String body = login(username, password).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(body);
        assertThat(node.get("tokenType").asText()).isEqualTo("Bearer");
        return node.get("accessToken").asText();
    }

    /** Admins can't self-register, so the test inserts one directly into the database. */
    private void createAdmin(String username, String password) {
        users.save(new AppUser(username, passwordEncoder.encode(password), Role.ADMIN));
    }

    /** POST /api/paintings carrying the given bearer token. */
    private ResultActions createPainting(String token) throws Exception {
        return mvc.perform(post("/api/paintings").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(PAINTING));
    }

    // ---- registration -------------------------------------------------------------------------------

    /** Sign-up makes a CUSTOMER (never an admin), lower-cases the name, and the response has no password or hash. */
    @Test
    void registrationCreatesACustomerAndNeverEchoesSecrets() throws Exception {
        register("Asha", "correct-horse").andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("asha"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(content().string(not(containsString("correct-horse"))))
                .andExpect(content().string(not(containsString("$2"))));
    }

    /** The database holds a BCrypt hash (starts with "$2"), not the password, and the hash verifies the password. */
    @Test
    void passwordsAreStoredAsBcryptHashes() throws Exception {
        register("asha", "correct-horse").andExpect(status().isCreated());

        String stored = users.findByUsername("asha").orElseThrow().getPasswordHash();

        assertThat(stored).startsWith("$2").isNotEqualTo("correct-horse");
        assertThat(passwordEncoder.matches("correct-horse", stored)).isTrue();
    }

    /** "asha" and "ASHA" are the same account, so the second sign-up is a 409 Conflict. */
    @Test
    void usernamesAreUniqueIgnoringCase() throws Exception {
        register("asha", "correct-horse").andExpect(status().isCreated());

        register("ASHA", "another-pass1").andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    /** Too-short, wrongly-formed and too-long usernames/passwords are rejected with per-field messages. */
    @Test
    void registrationValidatesInput() throws Exception {
        register("ab", "short").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
        register("has space", "long-enough-pw").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists());
        register("asha", "x".repeat(73)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    // ---- login --------------------------------------------------------------------------------------

    /** Anti-enumeration: an attacker can't tell "no such user" from "wrong password" by the response. */
    @Test
    void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
        register("asha", "correct-horse").andExpect(status().isCreated());

        String wrongPassword = login("asha", "wrong-password").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownUser = login("nobody", "wrong-password").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(json.readTree(wrongPassword).get("message")).isEqualTo(json.readTree(unknownUser).get("message"));
        assertThat(json.readTree(wrongPassword).get("message").asText()).isEqualTo("Invalid username or password");
    }

    /** Logging in as "ASHA" works for account "asha", and the response states the token lifetime (5 min in tests). */
    @Test
    void loginIsCaseInsensitiveOnUsernameAndReturnsAnExpiry() throws Exception {
        register("asha", "correct-horse").andExpect(status().isCreated());

        login("ASHA", "correct-horse").andExpect(status().isOk())
                .andExpect(jsonPath("$.expiresIn").value(300)); // test profile: 5m
    }

    // ---- using tokens -------------------------------------------------------------------------------

    /** A genuine CUSTOMER token is valid but has no write permission: 403. */
    @Test
    void aCustomerTokenCannotWrite() throws Exception {
        register("asha", "correct-horse").andExpect(status().isCreated());

        createPainting(tokenFor("asha", "correct-horse")).andExpect(status().isForbidden());
    }

    /** Full happy path: log in as admin, then create, update and delete a painting with the issued token. */
    @Test
    void anAdminTokenCanCreateUpdateAndDelete() throws Exception {
        createAdmin("boss", "admin-password");
        String token = tokenFor("boss", "admin-password");

        String created = createPainting(token).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();

        mvc.perform(put("/api/paintings/{id}", id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(PAINTING.replace("Sunset", "Sunrise")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Sunrise"));
        mvc.perform(delete("/api/paintings/{id}", id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    /** Forgery: a token claiming ADMIN but signed with a different key fails signature verification (401). */
    @Test
    void aTokenSignedWithAnotherKeyIsRejected() throws Exception {
        var otherKey = new SecretKeySpec("some-other-signing-key-0123456789-xyz".getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtEncoder forger = new NimbusJwtEncoder(new ImmutableSecret<>(otherKey));

        createPainting(tokenWith(forger, "mallory", List.of("ADMIN"), Instant.now().plusSeconds(300)))
                .andExpect(status().isUnauthorized());
    }

    /** A correctly signed token past its expiry time is no longer accepted. */
    @Test
    void anExpiredTokenIsRejected() throws Exception {
        // Signed with the real key but expired well beyond the decoder's clock-skew allowance.
        createPainting(tokenWith(jwtEncoder, "boss", List.of("ADMIN"), Instant.now().minusSeconds(600)))
                .andExpect(status().isUnauthorized());
    }

    /** Authentication is not authorisation: a genuine token with an empty roles list still can't write. */
    @Test
    void aValidlySignedTokenWithoutRolesCannotWrite() throws Exception {
        createPainting(tokenWith(jwtEncoder, "boss", List.of(), Instant.now().plusSeconds(300)))
                .andExpect(status().isForbidden());
    }

    /** Builds a signed token with chosen claims so tests can craft forged, expired or role-less tokens. */
    private static String tokenWith(JwtEncoder encoder, String subject, List<String> roles, Instant expiresAt) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(subject)
                .issuedAt(expiresAt.minusSeconds(900))
                .expiresAt(expiresAt)
                .claim("roles", roles)
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
