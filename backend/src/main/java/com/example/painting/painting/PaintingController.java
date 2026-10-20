package com.example.painting.painting;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paintings")
public class PaintingController {
    static final int MAX_PAGE_SIZE = 100;

    private final PaintingService service;

    public PaintingController(PaintingService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaintingResponse create(@Valid @RequestBody PaintingRequest request) {
        return PaintingResponse.from(service.create(request));
    }

    @GetMapping
    public PageResponse<PaintingResponse> findAll(
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        var pageable = PageRequest.of(page, size, Sort.by("id"));
        return PageResponse.from(service.findAll(title, pageable), PaintingResponse::from);
    }

    @GetMapping("/{id}")
    public PaintingResponse findById(@PathVariable Long id) {
        return PaintingResponse.from(service.findById(id));
    }

    @PutMapping("/{id}")
    public PaintingResponse update(@PathVariable Long id, @Valid @RequestBody PaintingRequest request) {
        return PaintingResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
