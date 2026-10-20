package com.example.painting.config;

import com.example.painting.error.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * Writes the 401 and 403 responses produced inside the security filter chain.
 *
 * Those failures happen before a request reaches any controller, so GlobalExceptionHandler never sees them.
 * This class writes the same {@link ApiError} JSON by hand so clients get one consistent error format.
 *  - {@link #commence}: not authenticated (no token, bad token, expired token) -> 401
 *  - {@link #handle}: authenticated but not allowed -> 403
 */
@Component
public class RestSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final ObjectMapper json;

    public RestSecurityHandlers(ObjectMapper json) {
        this.json = json;
    }

    /** 401: tells the client it must authenticate, and how ("Bearer" token). */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        write(request, response, HttpStatus.UNAUTHORIZED, "Authentication is required to access this resource.");
    }

    /** 403: the caller is known but lacks the required role. */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        write(request, response, HttpStatus.FORBIDDEN, "You do not have permission to perform this action.");
    }

    /** Serialises an ApiError straight into the servlet response. */
    private void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getOutputStream(),
                new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI(), null));
    }
}
