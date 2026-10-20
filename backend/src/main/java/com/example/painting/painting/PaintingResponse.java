package com.example.painting.painting;

import java.math.BigDecimal;

/**
 * Representation of a painting returned by the API. It is a separate type from the {@link Painting} entity
 * so the JSON contract does not change when the database model does, and so internals can never leak.
 */
public record PaintingResponse(
        Long id,
        String title,
        String artist,
        String description,
        BigDecimal price,
        Integer stock,
        String imageUrl) {

    /** Copies the entity's fields into the response shape. */
    public static PaintingResponse from(Painting painting) {
        return new PaintingResponse(
                painting.getId(),
                painting.getTitle(),
                painting.getArtist(),
                painting.getDescription(),
                painting.getPrice(),
                painting.getStock(),
                painting.getImageUrl());
    }
}
