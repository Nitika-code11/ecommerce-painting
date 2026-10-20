package com.example.painting.painting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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

/** End-to-end through the real controller, service, JPA and H2 (no seed data: "test" profile). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaintingApiIntegrationTest {
    private static final String VALID = """
            {"title":"Sunset","artist":"A. Sharma","description":"Acrylic","price":4500.00,"stock":3,
             "imageUrl":"https://example.com/sunset.jpg"}""";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PaintingRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    private long create(String body) throws Exception {
        MvcResult result = mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode node = json.readTree(result.getResponse().getContentAsString());
        return node.get("id").asLong();
    }

    @Test
    void createThenReadBack() throws Exception {
        long id = create(VALID);

        mvc.perform(get("/api/paintings/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Sunset"))
                .andExpect(jsonPath("$.price").value(4500.00))
                .andExpect(jsonPath("$.stock").value(3));
    }

    @Test
    void createIgnoresAClientSuppliedId() throws Exception {
        long id = create(VALID.replace("{", "{\"id\":999,"));

        assertThat(id).isNotEqualTo(999L);
    }

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

    @Test
    void updateReplacesThePainting() throws Exception {
        long id = create(VALID);

        mvc.perform(put("/api/paintings/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(VALID.replace("Sunset", "Sunrise").replace("\"stock\":3", "\"stock\":0")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Sunrise"))
                .andExpect(jsonPath("$.stock").value(0));
    }

    @Test
    void deleteRemovesThePainting() throws Exception {
        long id = create(VALID);

        mvc.perform(delete("/api/paintings/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/paintings/{id}", id)).andExpect(status().isNotFound());
    }

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

    @Test
    void malformedJsonIsA400() throws Exception {
        mvc.perform(post("/api/paintings").contentType(MediaType.APPLICATION_JSON).content("{nope"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"));
    }

    @Test
    void nonNumericIdIsA400() throws Exception {
        mvc.perform(get("/api/paintings/abc")).andExpect(status().isBadRequest());
    }

    @Test
    void outOfRangePagingParametersAreRejected() throws Exception {
        mvc.perform(get("/api/paintings").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").exists());
        mvc.perform(get("/api/paintings").param("page", "-1")).andExpect(status().isBadRequest());
    }

    @Test
    void unsupportedMethodIsA405WithTheStandardErrorShape() throws Exception {
        mvc.perform(delete("/api/paintings"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }

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

    @Test
    void healthEndpointIsUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void seedDataIsNotLoadedOutsideTheDevProfile() {
        assertThat(repository.count()).isZero();
    }
}
