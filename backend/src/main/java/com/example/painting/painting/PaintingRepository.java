package com.example.painting.painting;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaintingRepository extends JpaRepository<Painting, Long> {
    Page<Painting> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
