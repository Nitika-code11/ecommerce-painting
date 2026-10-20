package com.example.painting.painting;

import com.example.painting.error.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HTTP layer for paintings. It only translates between HTTP and the service: it binds and validates the
 * request, calls {@link PaintingService}, and converts entities to {@link PaintingResponse} DTOs.
 * Business rules live in the service; error bodies are produced by GlobalExceptionHandler.
 *
 * Access: the GET endpoints are public (see SecurityConfig); the write endpoints are restricted to ADMIN
 * with @PreAuthorize.
 */
@RestController
@RequestMapping("/api/paintings")
@Tag(name = "Paintings", description = "Browse the catalogue (public) and manage it (ADMIN only).")
public class PaintingController {
    /** Upper bound for ?size= so one request cannot ask the database for an unbounded result set. */
    static final int MAX_PAGE_SIZE = 100;

    private final PaintingService service;

    public PaintingController(PaintingService service) {
        this.service = service;
    }

    /** Creates a painting. {@code @Valid} runs the Bean Validation rules declared on PaintingRequest. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a painting", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "400", description = "Validation failed; see fieldErrors",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "Missing, invalid or expired token",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "Signed in but not an ADMIN",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PaintingResponse create(@Valid @RequestBody PaintingRequest request) {
        return PaintingResponse.from(service.create(request));
    }

    /**
     * Lists paintings one page at a time, optionally filtered by a case-insensitive title substring.
     * Page and size are range-checked by the annotations; a violation becomes a 400 with fieldErrors.
     */
    @GetMapping
    @Operation(summary = "List paintings (paged), optionally filtered by title")
    public PageResponse<PaintingResponse> findAll(
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        // Sorting by id gives a stable order, so paging never skips or repeats rows.
        var pageable = PageRequest.of(page, size, Sort.by("id"));
        return PageResponse.from(service.findAll(title, pageable), PaintingResponse::from);
    }

    /** Returns one painting, or 404 if the id does not exist. */
    @GetMapping("/{id}")
    @Operation(summary = "Get one painting")
    @ApiResponse(responseCode = "404", description = "No painting with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PaintingResponse findById(@PathVariable Long id) {
        return PaintingResponse.from(service.findById(id));
    }

    /** Replaces every editable field of an existing painting (PUT = full replacement, not a partial patch). */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Replace a painting", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "404", description = "No painting with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PaintingResponse update(@PathVariable Long id, @Valid @RequestBody PaintingRequest request) {
        return PaintingResponse.from(service.update(id, request));
    }

    /** Deletes a painting; responds 204 with no body on success, 404 if it does not exist. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a painting", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "404", description = "No painting with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
