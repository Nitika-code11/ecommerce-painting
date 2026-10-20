package com.example.painting.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata for the generated OpenAPI document (served at /v3/api-docs, with Swagger UI at /swagger-ui.html).
 * Both are switched on only in the dev profile (see application-dev.yml).
 *
 * The "bearerAuth" scheme declared here is what lets the Swagger UI "Authorize" button send the JWT
 * obtained from POST /api/auth/login; endpoints opt in with @SecurityRequirement(name = "bearerAuth").
 */
@Configuration
@OpenAPIDefinition(info = @Info(
        title = "Painting Store API",
        version = "0.1.0",
        description = "Catalogue of paintings. Reading is public; creating, updating and deleting need an ADMIN token."))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the accessToken returned by POST /api/auth/login.")
public class OpenApiConfig {
}
