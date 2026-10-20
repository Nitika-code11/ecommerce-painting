package com.example.painting.painting;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request body for creating or replacing a painting. A record is an immutable data carrier, and the
 * annotations are the validation rules: they run when the controller parameter is marked {@code @Valid},
 * and any failure becomes a 400 response listing each offending field.
 */
public record PaintingRequest(
        // Required text, within the column length.
        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 120) String artist,
        // Optional (null is allowed), but capped.
        @Size(max = 2000) String description,
        // Required; at least one paisa/cent; at most 10 whole digits and 2 decimals so it always fits NUMERIC(12,2).
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
        // Required, and never negative.
        @NotNull @Min(0) Integer stock,
        // Optional; when present it must be an http(s) URL (blocks javascript:, data:, ftp: and similar).
        @Size(max = 1000) @Pattern(regexp = "^https?://\\S+$", message = "must be an http(s) URL") String imageUrl) {
}
