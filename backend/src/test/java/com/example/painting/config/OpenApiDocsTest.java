package com.example.painting.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasKey;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** With springdoc enabled, the OpenAPI document is generated from the controllers and is public. */
@SpringBootTest(properties = {
        "springdoc.api-docs.enabled=true",
        // Own database so this context never shares state with the other test contexts.
        "spring.datasource.url=jdbc:h2:mem:openapitest;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDocsTest {
    @Autowired MockMvc mvc;

    @Test
    void documentDescribesTheEndpointsAndTheBearerScheme() throws Exception {
        mvc.perform(get("/v3/api-docs")) // no token: the docs are public when enabled
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Painting Store API"))
                .andExpect(jsonPath("$.paths", hasKey("/api/paintings")))
                .andExpect(jsonPath("$.paths", hasKey("/api/paintings/{id}")))
                .andExpect(jsonPath("$.paths", hasKey("/api/auth/login")))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                // Only the write operations ask for the token.
                .andExpect(jsonPath("$.paths['/api/paintings'].post.security[0].bearerAuth").exists())
                .andExpect(jsonPath("$.paths['/api/paintings'].get.security").doesNotExist());
    }
}
