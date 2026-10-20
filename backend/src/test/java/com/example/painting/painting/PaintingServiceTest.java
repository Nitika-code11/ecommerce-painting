package com.example.painting.painting;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaintingServiceTest {
    private static final Pageable PAGE = PageRequest.of(0, 12);

    @Mock PaintingRepository repository;
    @InjectMocks PaintingService service;

    private static PaintingRequest request(String title) {
        return new PaintingRequest(title, "Artist", "desc", new BigDecimal("10.50"), 3, "https://x.test/a.jpg");
    }

    private static Painting painting(String title) {
        return new Painting(title, "Artist", "desc", new BigDecimal("10.50"), 3, null);
    }

    @Test
    void createSavesTheRequestedFields() {
        when(repository.save(any(Painting.class))).thenAnswer(inv -> inv.getArgument(0));

        Painting saved = service.create(request("Sunset"));

        assertThat(saved.getTitle()).isEqualTo("Sunset");
        assertThat(saved.getPrice()).isEqualByComparingTo("10.50");
        assertThat(saved.getStock()).isEqualTo(3);
    }

    @Test
    void findAllWithoutTitleReturnsEveryPainting() {
        Page<Painting> page = new PageImpl<>(List.of(painting("A")));
        when(repository.findAll(PAGE)).thenReturn(page);

        assertThat(service.findAll(null, PAGE)).isSameAs(page);
        assertThat(service.findAll("   ", PAGE)).isSameAs(page);
        verify(repository, never()).findByTitleContainingIgnoreCase(any(), any());
    }

    @Test
    void findAllWithTitleSearchesCaseInsensitivelyOnTrimmedText() {
        Page<Painting> page = new PageImpl<>(List.of(painting("Sunset")));
        when(repository.findByTitleContainingIgnoreCase("sun", PAGE)).thenReturn(page);

        assertThat(service.findAll("  sun ", PAGE)).isSameAs(page);
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(9L))
                .isInstanceOf(PaintingNotFoundException.class)
                .hasMessage("Painting not found: 9");
    }

    @Test
    void updateReplacesAllEditableFields() {
        Painting existing = painting("Old");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        Painting updated = service.update(1L, request("New"));

        assertThat(updated.getTitle()).isEqualTo("New");
        assertThat(updated.getImageUrl()).isEqualTo("https://x.test/a.jpg");
    }

    @Test
    void updateThrowsWhenMissing() {
        when(repository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(2L, request("x"))).isInstanceOf(PaintingNotFoundException.class);
    }

    @Test
    void deleteRemovesAnExistingPainting() {
        Painting existing = painting("A");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(repository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(3L)).isInstanceOf(PaintingNotFoundException.class);
        verify(repository, never()).delete(any());
    }
}
