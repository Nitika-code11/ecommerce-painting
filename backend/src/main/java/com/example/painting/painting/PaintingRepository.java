package com.example.painting.painting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaintingRepository extends JpaRepository<Painting, Long> {
    List<Painting> findByTitleContainingIgnoreCase(String title);
}
