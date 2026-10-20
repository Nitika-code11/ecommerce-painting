package com.example.painting.painting;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paintings")
public class PaintingController {
    private final PaintingService service;

    public PaintingController(PaintingService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Painting create(@Valid @RequestBody Painting painting) {
        return service.create(painting);
    }

    @GetMapping
    public List<Painting> findAll(@RequestParam(required = false) String title) {
        return service.findAll(title);
    }

    @GetMapping("/{id}")
    public Painting findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public Painting update(@PathVariable Long id, @Valid @RequestBody Painting painting) {
        return service.update(id, painting);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
