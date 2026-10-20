package com.example.painting.painting;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Stable JSON envelope for paged results. We build our own instead of serialising Spring's PageImpl
 * directly, because PageImpl's JSON shape is not a supported contract and can change between versions.
 *
 * @param content       the items on this page
 * @param page          zero-based page number
 * @param size          requested page size
 * @param totalElements number of matching items across all pages
 * @param totalPages    number of pages needed to show all matching items
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    /** Converts a Spring Data page of entities into a page of DTOs, using {@code mapper} for each item. */
    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
