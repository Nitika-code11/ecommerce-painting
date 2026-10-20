package com.example.painting.painting;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may call what: reads are public, writes are ADMIN-only.
 * Users are simulated with {@code @WithMockUser} / {@code @WithAnonymousUser}, which put a fake authenticated
 * (or anonymous) user into the security context, so these tests check the access rules without real tokens.
 * (Real login and token handling is covered in AuthApiIntegrationTest.)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaintingSecurityTest {
    private static final String BODY = """
            {"title":"Sunset","artist":"A. Sharma","price":4500.00,"stock":3}""";

    @Autowired MockMvc mvc;

    // Helpers: the three write operations, so each test reads as "this user tries to create / replace / delete".
    private ResultActions create() throws Exception {
        return mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content(BODY));
    }

    private ResultActions replace() throws Exception {
        return mvc.perform(put("/api/paintings/1").contentType(MediaType.APPLICATION_JSON).content(BODY));
    }

    private ResultActions remove() throws Exception {
        return mvc.perform(delete("/api/paintings/1"));
    }

    /** Asserts the standard 401 response: status, "WWW-Authenticate: Bearer" header and the ApiError body. */
    private static void expectUnauthorized(ResultActions result) throws Exception {
        result.andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    /** Asserts the standard 403 response and its ApiError body. */
    private static void expectForbidden(ResultActions result) throws Exception {
        result.andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("You do not have permission to perform this action."));
    }

    /** A guest can list and open paintings, and call the health probe, without any token. */
    @Test
    @WithAnonymousUser
    void anonymousUsersCanReadTheCatalogue() throws Exception {
        mvc.perform(get("/api/paintings")).andExpect(status().isOk());
        mvc.perform(get("/api/paintings/1")).andExpect(status().isNotFound()); // reached the controller, not blocked
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    /** A guest trying to create, replace or delete gets 401 ("who are you?"). */
    @Test
    @WithAnonymousUser
    void anonymousUsersCannotWrite() throws Exception {
        expectUnauthorized(create());
        expectUnauthorized(replace());
        expectUnauthorized(remove());
    }

    /** Paths nobody listed as public (unknown routes, other actuator endpoints) require authentication. */
    @Test
    @WithAnonymousUser
    void everythingElseIsDeniedByDefault() throws Exception {
        expectUnauthorized(mvc.perform(get("/api/something-else")));
        expectUnauthorized(mvc.perform(get("/actuator/env")));
    }

    /** A signed-in CUSTOMER can read but gets 403 ("I know you, but no") on every write. */
    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customersCanReadButNotWrite() throws Exception {
        mvc.perform(get("/api/paintings")).andExpect(status().isOk());
        expectForbidden(create());
        expectForbidden(replace());
        expectForbidden(remove());
    }

    /** An ADMIN passes the access check (create succeeds; deleting a missing id reaches the controller and is a 404). */
    @Test
    @WithMockUser(roles = "ADMIN")
    void adminsCanWrite() throws Exception {
        create().andExpect(status().isCreated());
        remove().andExpect(status().isNotFound()); // allowed through; the id simply does not exist
    }

    /** A garbage token is a 401 even on public endpoints: a bad credential is never silently ignored. */
    @Test
    void aMalformedBearerTokenIsRejected() throws Exception {
        expectUnauthorized(mvc.perform(post("/api/paintings")
                .header("Authorization", "Bearer not-a-real-token")
                .contentType(MediaType.APPLICATION_JSON).content(BODY)));
        // Reading stays public, but a bad token is still an error rather than silently ignored.
        mvc.perform(get("/api/paintings").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }
}
