package com.example.painting.painting;

/**
 * Thrown by the service when an id does not exist. GlobalExceptionHandler turns it into a 404 response,
 * so the service stays free of any HTTP concerns.
 */
public class PaintingNotFoundException extends RuntimeException {
    public PaintingNotFoundException(Long id) {
        super("Painting not found: " + id);
    }
}
