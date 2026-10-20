package com.example.painting.error;

import com.example.painting.auth.UsernameTakenException;
import com.example.painting.painting.PaintingNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central place that turns every exception thrown while handling a request into an {@link ApiError} response.
 * {@code @RestControllerAdvice} makes it apply to all controllers.
 *
 * Extending {@link ResponseEntityExceptionHandler} keeps Spring's standard status mapping for framework errors
 * (405 wrong method, 415 wrong content type, unknown route, ...) while this class controls the body, so even
 * those errors use the same JSON shape as everything else.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ---- our own exceptions ------------------------------------------------------------------------

    /** A painting id that does not exist. */
    @ExceptionHandler(PaintingNotFoundException.class)
    ResponseEntity<Object> handleNotFound(PaintingNotFoundException ex, WebRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), null, request);
    }

    /** Thrown by {@code @PreAuthorize}; without this the catch-all below would turn it into a 500. */
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action.", null, request);
    }

    /** Failed login (bad credentials). The message is already generic so it can be shown as is. */
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<Object> handleAuthentication(AuthenticationException ex, WebRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), null, request);
    }

    /** Registering a username that already exists. */
    @ExceptionHandler(UsernameTakenException.class)
    ResponseEntity<Object> handleUsernameTaken(UsernameTakenException ex, WebRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), null, request);
    }

    /**
     * Safety net for anything unexpected (a bug, a database outage...). The real cause goes to the log; the client
     * only gets a generic message so no internals leak.
     */
    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.", null, request);
    }

    // ---- Spring MVC exceptions whose body we replace ---------------------------------------------

    /** A request body failed its Bean Validation rules: report every bad field once. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        // putIfAbsent keeps the first message when one field breaks several rules.
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "Request validation failed", fieldErrors, request);
    }

    /** A request parameter (e.g. ?size=500) failed its constraint annotations. */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getAllValidationResults().forEach(result -> {
            String name = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().forEach(error ->
                    fieldErrors.putIfAbsent(name == null ? "parameter" : name, error.getDefaultMessage()));
        });
        return build(HttpStatus.BAD_REQUEST, "Request validation failed", fieldErrors, request);
    }

    /** The body was not valid JSON (or had the wrong types). The parser's message is hidden on purpose. */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Malformed JSON request", null, request);
    }

    /** Fallback for every other standard Spring MVC exception: keep its status, replace its body. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        // Spring supplies a ProblemDetail whose "detail" is a ready-made description; fall back to the reason phrase.
        String message = body instanceof ProblemDetail problem && problem.getDetail() != null
                ? problem.getDetail()
                : HttpStatus.valueOf(statusCode.value()).getReasonPhrase();
        return build(HttpStatus.valueOf(statusCode.value()), message, null, request);
    }

    /** Assembles the {@link ApiError} body and wraps it in a response with the matching status. */
    private ResponseEntity<Object> build(
            HttpStatus status, String message, Map<String, String> fieldErrors, WebRequest request) {
        String path = request instanceof ServletWebRequest servlet ? servlet.getRequest().getRequestURI() : null;
        var body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, path, fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
