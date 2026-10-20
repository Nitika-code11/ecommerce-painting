package com.example.painting.painting;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Database access for paintings. Spring Data generates the implementation at startup, so this interface is
 * all that is written. {@link JpaRepository} already provides save, findById, findAll(Pageable), delete, count...
 */
public interface PaintingRepository extends JpaRepository<Painting, Long> {

    /**
     * Derived query: the method name is parsed into SQL, roughly
     * {@code WHERE upper(title) LIKE upper('%' || :title || '%')} with paging applied.
     */
    Page<Painting> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
