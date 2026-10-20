package com.example.painting.painting;

import java.math.BigDecimal;

/** Representation of a painting returned by the API. */
public record PaintingResponse(
        Long id,
        String title,
        String artist,
        String description,
        BigDecimal price,
        Integer stock,
        String imageUrl) {

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
