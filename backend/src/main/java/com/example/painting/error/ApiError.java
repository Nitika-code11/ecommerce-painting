package com.example.painting.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * The single JSON error shape returned for every failed request, whether it was rejected by validation,
 * by security, by routing or by an unexpected bug. Clients only need to understand this one format.
 *
 * @param timestamp   when the error was produced (UTC)
 * @param status      HTTP status code, repeated in the body for convenience
 * @param error       the status's standard reason phrase, e.g. "Not Found"
 * @param message     a human-readable explanation; never contains stack traces or internals
 * @param path        the request path that failed
 * @param fieldErrors present only for validation failures: field name to problem description
 */
@JsonInclude(JsonInclude.Include.NON_NULL) // leave out null properties (e.g. fieldErrors) instead of printing null
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {
}
