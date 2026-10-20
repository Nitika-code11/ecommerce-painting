package com.example.painting.painting;

public class PaintingNotFoundException extends RuntimeException {
    public PaintingNotFoundException(Long id) {
        super("Painting not found: " + id);
    }
}
