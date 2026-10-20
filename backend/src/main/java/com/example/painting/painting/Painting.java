package com.example.painting.painting;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Persistence model: one row of the {@code paintings} table (created by the V1 Flyway migration).
 * Hibernate maps the fields below to columns and only validates that the table matches (ddl-auto: validate).
 *
 * Input rules (not blank, price at least 0.01, ...) live on {@link PaintingRequest}; the column limits here
 * mirror them so the schema stays consistent with the API contract.
 */
@Entity
@Table(name = "paintings")
public class Painting {
    /** Primary key, assigned by the database (identity column). Clients can never choose it. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 120)
    private String artist;

    /** Optional free text. */
    @Column(length = 2000)
    private String description;

    /** Money is a BigDecimal (exact decimal), never double: 12 digits in total, 2 after the decimal point. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** Units in stock; 0 means sold out. */
    @Column(nullable = false)
    private Integer stock;

    /** Optional link to a picture, stored as text (the API validates it is an http(s) URL). */
    @Column(length = 1000)
    private String imageUrl;

    /** Required by JPA to instantiate rows; protected so application code must use the full constructor. */
    protected Painting() {}

    public Painting(String title, String artist, String description, BigDecimal price, Integer stock, String imageUrl) {
        apply(title, artist, description, price, stock, imageUrl);
    }

    /**
     * Replaces every editable field at once (full-update semantics, as used by PUT).
     * There are deliberately no individual setters, so the entity can't be left half-updated.
     */
    public void apply(String title, String artist, String description, BigDecimal price, Integer stock, String imageUrl) {
        this.title = title;
        this.artist = artist;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getArtist() { return artist; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public Integer getStock() { return stock; }
    public String getImageUrl() { return imageUrl; }
}
