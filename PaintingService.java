package com.example.painting.painting;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PaintingService {
    private final PaintingRepository repository;

    public PaintingService(PaintingRepository repository) {
        this.repository = repository;
    }

    public Painting create(Painting painting) {
        painting.setId(null);
        return repository.save(painting);
    }

    public List<Painting> findAll(String title) {
        if (title != null && !title.isBlank()) {
            return repository.findByTitleContainingIgnoreCase(title);
        }
        return repository.findAll();
    }

    public Painting findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Painting not found: " + id));
    }

    public Painting update(Long id, Painting request) {
        Painting existing = findById(id);
        existing.setTitle(request.getTitle());
        existing.setArtist(request.getArtist());
        existing.setDescription(request.getDescription());
        existing.setPrice(request.getPrice());
        existing.setStock(request.getStock());
        existing.setImageUrl(request.getImageUrl());
        return repository.save(existing);
    }

    public void delete(Long id) {
        Painting existing = findById(id);
        repository.delete(existing);
    }
}
