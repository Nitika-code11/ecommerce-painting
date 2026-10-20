package com.example.painting.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS (Cross-Origin Resource Sharing). Browsers block a page from calling an API on a different origin
 * (scheme + host + port) unless the API says that origin is allowed. This class declares which origins
 * may call {@code /api/**}; Spring Security applies the rule early (see {@code .cors(...)} in SecurityConfig).
 *
 * CORS only restrains browsers. It is not authentication, so it never replaces the token checks.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String[] allowedOrigins;

    /** Origins come from {@code app.cors.allowed-origins} (env var APP_CORS_ALLOWED_ORIGINS), comma separated. */
    public WebConfig(@Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)               // an explicit allow-list, never "*"
                .allowedMethods("GET", "POST", "PUT", "DELETE") // the only verbs the API uses
                .allowedHeaders("Content-Type", "Accept", "Authorization") // Authorization carries the JWT
                .maxAge(3600);                                // browsers may cache the preflight answer for an hour
    }
}
