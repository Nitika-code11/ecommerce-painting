package com.example.painting.painting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests of the painting API through the real controller, service, JPA and H2 (no seed data: "test" profile).
 * MockMvc calls the controllers in-process, without opening a network port, but through the full Spring Security
 * and exception-handling stack, so status codes and JSON bodies are exactly what a client would see.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN") // writes need ADMIN; who may do what is covered in PaintingSecurityTest
class PaintingApiIntegrationTest {
    private static final String VALID = """
            {"title":"Sunset","artist":"A. Sharma","description":"Acrylic","price":4500.00,"stock":3,
             "imageUrl":"https://example.com/sunset.jpg"}""";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PaintingRepository repository;

    /** Every test starts from an empty table so tests can't affect each other. */
    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    /** Helper: POSTs a painting, asserts it was created (201) and returns the generated id. */
    private long create(String body) throws Exception {
        MvcResult result = mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode node = json.readTree(result.getResponse().getContentAsString());
        return node.get("id").asLong();
    }

    /** What you POST is what you GET back, including exact decimal price. */
    @Test
    void createThenReadBack() throws Exception {
        long id = create(VALID);

        mvc.perform(get("/api/paintings/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Sunset"))
                .andExpect(jsonPath("$.price").value(4500.00))
                .andExpect(jsonPath("$.stock").value(3));
    }

    /** A client sending "id":999 cannot choose its own primary key. */
    @Test
    void createIgnoresAClientSuppliedId() throws Exception {
        long id = create(VALID.replace("{", "{\"id\":999,"));

        assertThat(id).isNotEqualTo(999L);
    }

    /** 5 paintings, page size 2: page 1 has 2 items and the totals describe all 5; the title filter narrows results. */
    @Test
    void listIsPagedAndFilterable() throws Exception {
        for (int i = 1; i <= 5; i++) create(VALID.replace("Sunset", i % 2 == 0 ? "Moon " + i : "Sun " + i));

        mvc.perform(get("/api/paintings").param("size", "2").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));

        mvc.perform(get("/api/paintings").param("title", "moon"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    /** PUT overwrites the editable fields (title changed, stock set to 0). */
    @Test
    void updateReplacesThePainting() throws Exception {
        long id = create(VALID);

        mvc.perform(put("/api/paintings/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(VALID.replace("Sunset", "Sunrise").replace("\"stock\":3", "\"stock\":0")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Sunrise"))
                .andExpect(jsonPath("$.stock").value(0));
    }

    /** DELETE returns 204, and the painting is gone afterwards (404). */
    @Test
    void deleteRemovesThePainting() throws Exception {
        long id = create(VALID);

        mvc.perform(delete("/api/paintings/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/paintings/{id}", id)).andExpect(status().isNotFound());
    }

    /** GET, PUT and DELETE of an unknown id are all 404, with the standard ApiError JSON body. */
    @Test
    void missingPaintingIsA404WithTheStandardErrorShape() throws Exception {
        mvc.perform(get("/api/paintings/12345"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Painting not found: 12345"))
                .andExpect(jsonPath("$.path").value("/api/paintings/12345"));
        mvc.perform(put("/api/paintings/12345").contentType(MediaType.APPLICATION_JSON).content(VALID))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/paintings/12345")).andExpect(status().isNotFound());
    }

    /** A body breaking several rules gets a 400 that names each bad field. */
    @Test
    void invalidBodyReturnsFieldErrors() throws Exception {
        String body = """
                {"title":"","artist":"A","price":0,"stock":-1,"imageUrl":"ftp://x"}""";

        mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.price").exists())
                .andExpect(jsonPath("$.fieldErrors.stock").exists())
                .andExpect(jsonPath("$.fieldErrors.imageUrl").exists());
    }

    /** Broken JSON is a client error (400) with a safe message, not a 500. */
    @Test
    void malformedJsonIsA400() throws Exception {
        mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content("{nope"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"));
    }

    /** /api/paintings/abc cannot be converted to a number: 400. */
    @Test
    void nonNumericIdIsA400() throws Exception {
        mvc.perform(get("/api/paintings/abc")).andExpect(status().isBadRequest());
    }

    /** size above the cap of 100, or a negative page, is rejected so no one can request unbounded results. */
    @Test
    void outOfRangePagingParametersAreRejected() throws Exception {
        mvc.perform(get("/api/paintings").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").exists());
        mvc.perform(get("/api/paintings").param("page", "-1")).andExpect(status().isBadRequest());
    }

    /** A framework-level error (wrong HTTP method) also uses the standard ApiError body. */
    @Test
    void unsupportedMethodIsA405WithTheStandardErrorShape() throws Exception {
        mvc.perform(delete("/api/paintings"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }

    /** A browser "preflight" from the allowed origin succeeds; the same request from another origin is refused. */
    @Test
    void corsAllowsOnlyTheConfiguredOrigin() throws Exception {
        mvc.perform(options("/api/paintings")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/paintings")
                        .header("Origin", "http://evil.test")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    /** The health probe used by load balancers reports UP. */
    @Test
    void healthEndpointIsUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    /** The sample paintings come from a dev-only migration; with the "test" profile the table starts empty. */
    @Test
    void seedDataIsNotLoadedOutsideTheDevProfile() {
        assertThat(repository.count()).isZero();
    }
}
