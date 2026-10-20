package com.example.painting.painting;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaintingService {
    private final PaintingRepository repository;

    public PaintingService(PaintingRepository repository) {
        this.repository = repository;
    }

    public Painting create(PaintingRequest request) {
        return repository.save(new Painting(
                request.title(), request.artist(), request.description(),
                request.price(), request.stock(), request.imageUrl()));
    }

    @Transactional(readOnly = true)
    public Page<Painting> findAll(String title, Pageable pageable) {
        if (title != null && !title.isBlank()) {
            return repository.findByTitleContainingIgnoreCase(title.trim(), pageable);
        }
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Painting findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new PaintingNotFoundException(id));
    }

    public Painting update(Long id, PaintingRequest request) {
        Painting existing = findById(id);
        existing.apply(request.title(), request.artist(), request.description(),
                request.price(), request.stock(), request.imageUrl());
        return existing;
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
