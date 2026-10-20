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

@DataJpaTest
@ActiveProfiles("test")
class PaintingRepositoryTest {
    @Autowired PaintingRepository repository;

    private void save(String title) {
        repository.save(new Painting(title, "Artist", null, new BigDecimal("5.00"), 1, null));
    }

    @Test
    void titleSearchIsCaseInsensitiveAndMatchesSubstrings() {
        save("Sunset Over Hills");
        save("Starry Night");

        Page<Painting> result = repository.findByTitleContainingIgnoreCase("SUN", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(Painting::getTitle).containsExactly("Sunset Over Hills");
    }

    @Test
    void resultsArePaged() {
        for (int i = 1; i <= 5; i++) save("Painting " + i);

        Page<Painting> second = repository.findAll(PageRequest.of(1, 2, Sort.by("id")));

        assertThat(second.getContent()).hasSize(2);
        assertThat(second.getTotalElements()).isEqualTo(5);
        assertThat(second.getTotalPages()).isEqualTo(3);
    }

    @Test
    void longTextFieldsFitTheirColumns() {
        var painting = new Painting("T", "A", "d".repeat(2000), new BigDecimal("1.00"), 0, "https://x.test/" + "i".repeat(900));

        assertThat(repository.saveAndFlush(painting).getId()).isNotNull();
    }
}
