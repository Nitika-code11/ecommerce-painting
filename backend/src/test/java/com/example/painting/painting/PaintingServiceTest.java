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

/**
 * Unit test of PaintingService's business logic. The repository is a Mockito mock, so no Spring context and no
 * database are involved: this runs in milliseconds and pinpoints logic errors in the service itself.
 */
@ExtendWith(MockitoExtension.class)
class PaintingServiceTest {
    private static final Pageable PAGE = PageRequest.of(0, 12);

    @Mock PaintingRepository repository;          // fake repository whose answers each test scripts
    @InjectMocks PaintingService service;         // the real service, built with the mock above

    /** Helper: a valid request body with the given title. */
    private static PaintingRequest request(String title) {
        return new PaintingRequest(title, "Artist", "desc", new BigDecimal("10.50"), 3, "https://x.test/a.jpg");
    }

    /** Helper: an existing entity, as the repository would return it. */
    private static Painting painting(String title) {
        return new Painting(title, "Artist", "desc", new BigDecimal("10.50"), 3, null);
    }

    /** create() copies the request's fields onto the entity it saves. */
    @Test
    void createSavesTheRequestedFields() {
        // save() returns whatever it was given, like a real repository would (apart from the generated id).
        when(repository.save(any(Painting.class))).thenAnswer(inv -> inv.getArgument(0));

        Painting saved = service.create(request("Sunset"));

        assertThat(saved.getTitle()).isEqualTo("Sunset");
        assertThat(saved.getPrice()).isEqualByComparingTo("10.50");
        assertThat(saved.getStock()).isEqualTo(3);
    }

    /** With no (or a blank) title filter the service lists everything and never runs the search query. */
    @Test
    void findAllWithoutTitleReturnsEveryPainting() {
        Page<Painting> page = new PageImpl<>(List.of(painting("A")));
        when(repository.findAll(PAGE)).thenReturn(page);

        assertThat(service.findAll(null, PAGE)).isSameAs(page);
        assertThat(service.findAll("   ", PAGE)).isSameAs(page);
        verify(repository, never()).findByTitleContainingIgnoreCase(any(), any());
    }

    /** A title filter is trimmed and passed to the case-insensitive search query. */
    @Test
    void findAllWithTitleSearchesCaseInsensitivelyOnTrimmedText() {
        Page<Painting> page = new PageImpl<>(List.of(painting("Sunset")));
        when(repository.findByTitleContainingIgnoreCase("sun", PAGE)).thenReturn(page);

        assertThat(service.findAll("  sun ", PAGE)).isSameAs(page);
    }

    /** An unknown id becomes a PaintingNotFoundException (which the web layer maps to 404). */
    @Test
    void findByIdThrowsWhenMissing() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(9L))
                .isInstanceOf(PaintingNotFoundException.class)
                .hasMessage("Painting not found: 9");
    }

    /** update() overwrites every editable field of the existing entity. */
    @Test
    void updateReplacesAllEditableFields() {
        Painting existing = painting("Old");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        Painting updated = service.update(1L, request("New"));

        assertThat(updated.getTitle()).isEqualTo("New");
        assertThat(updated.getImageUrl()).isEqualTo("https://x.test/a.jpg");
    }

    /** Updating something that does not exist is an error, not a silent create. */
    @Test
    void updateThrowsWhenMissing() {
        when(repository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(2L, request("x"))).isInstanceOf(PaintingNotFoundException.class);
    }

    /** delete() looks the painting up and removes exactly that entity. */
    @Test
    void deleteRemovesAnExistingPainting() {
        Painting existing = painting("A");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }

    /** Deleting something that does not exist fails and deletes nothing. */
    @Test
    void deleteThrowsWhenMissing() {
        when(repository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(3L)).isInstanceOf(PaintingNotFoundException.class);
        verify(repository, never()).delete(any());
    }
}
