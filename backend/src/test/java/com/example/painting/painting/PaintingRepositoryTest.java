package com.example.painting.painting;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests the repository against a real (in-memory H2) database with the real Flyway schema.
 * {@code @DataJpaTest} starts only the persistence layer, and rolls back after each test so tests don't interfere.
 * The "test" profile is used so the dev sample paintings are NOT loaded.
 */
@DataJpaTest
@ActiveProfiles("test")
class PaintingRepositoryTest {
    @Autowired PaintingRepository repository;

    /** Helper: stores a minimal valid painting with the given title. */
    private void save(String title) {
        repository.save(new Painting(title, "Artist", null, new BigDecimal("5.00"), 1, null));
    }

    /** The derived query ignores case and matches anywhere inside the title. */
    @Test
    void titleSearchIsCaseInsensitiveAndMatchesSubstrings() {
        save("Sunset Over Hills");
        save("Starry Night");

        Page<Painting> result = repository.findByTitleContainingIgnoreCase("SUN", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(Painting::getTitle).containsExactly("Sunset Over Hills");
    }

    /** Page 2 of 5 rows with size 2 holds 2 rows, and the page metadata is right. */
    @Test
    void resultsArePaged() {
        for (int i = 1; i <= 5; i++) save("Painting " + i);

        Page<Painting> second = repository.findAll(PageRequest.of(1, 2, Sort.by("id")));

        assertThat(second.getContent()).hasSize(2);
        assertThat(second.getTotalElements()).isEqualTo(5);
        assertThat(second.getTotalPages()).isEqualTo(3);
    }

    /** The maximum-length description and image URL really fit the columns (guards against a too-small schema). */
    @Test
    void longTextFieldsFitTheirColumns() {
        var painting = new Painting("T", "A", "d".repeat(2000), new BigDecimal("1.00"), 0, "https://x.test/" + "i".repeat(900));

        // saveAndFlush forces the INSERT now, so a column that is too small would fail inside this test.
        assertThat(repository.saveAndFlush(painting).getId()).isNotNull();
    }
}
