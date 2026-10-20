package com.example.painting.config;

import com.example.painting.auth.SecurityProperties;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Stateless JWT security for the API.
 *
 * Request flow: every request passes through the filter chain built in {@link #apiSecurity}. If it carries an
 * {@code Authorization: Bearer <jwt>} header, the token's signature and expiry are verified and the user's roles
 * are read from it. URL rules then decide who may proceed; finer role rules sit on the controller methods via
 * {@code @PreAuthorize} (enabled by {@code @EnableMethodSecurity}).
 *
 * Summary: reading the catalogue and signing in/up are public; everything else needs a valid token.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(SecurityProperties.class) // binds app.security.* from application.yml to a typed object
public class SecurityConfig {

    /** Defines which requests are allowed through and how tokens are checked. */
    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, RestSecurityHandlers handlers) throws Exception {
        http
                // No cookies or sessions: the bearer token is not sent automatically by browsers, so CSRF does not apply.
                .csrf(AbstractHttpConfigurer::disable)
                // Use the CORS rules from WebConfig (needed so preflight requests are answered before authentication).
                .cors(Customizer.withDefaults())
                // Never create a server-side session; each request must prove itself with its token.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public: anyone may browse the catalogue.
                        .requestMatchers(HttpMethod.GET, "/api/paintings", "/api/paintings/**").permitAll()
                        // Public: obtaining a token and creating a customer account.
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                        // Public: health probe for load balancers and orchestrators.
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                        // API docs: these routes only exist when springdoc is enabled (dev profile).
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs/**",
                                "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        // Everything else (including POST/PUT/DELETE on paintings and any unknown path) needs a valid token.
                        .anyRequest().authenticated())
                // 401/403 produced by the filters are written as JSON ApiError bodies by our handlers.
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(handlers)
                        .accessDeniedHandler(handlers))
                // Treat this app as an OAuth2 "resource server": it accepts and verifies bearer JWTs.
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(handlers)
                        .accessDeniedHandler(handlers));
        return http.build();
    }

    /** BCrypt: a slow, salted one-way hash, so stolen hashes are expensive to crack. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** The shared HMAC key used both to sign new tokens and to verify incoming ones. */
    @Bean
    SecretKey jwtSigningKey(SecurityProperties properties) {
        return new SecretKeySpec(properties.jwt().secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /** Signs the tokens issued at login. */
    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSigningKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSigningKey));
    }

    /** Verifies signature and expiry of incoming tokens. Only HS256 is accepted, never "none" or other algorithms. */
    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSigningKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSigningKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    /** Maps the token's {@code roles} claim to {@code ROLE_*} authorities (so {@code hasRole('ADMIN')} works). */
    private static JwtAuthenticationConverter jwtAuthenticationConverter() {
        var authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");   // read the list from the "roles" claim, e.g. ["ADMIN"]
        authorities.setAuthorityPrefix("ROLE_");        // hasRole('ADMIN') looks for the authority ROLE_ADMIN
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
