package com.example.painting.painting;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Persistence model. Input rules live on {@link PaintingRequest}; the column limits here
 * mirror them so the schema stays consistent with the API contract.
 */
@Entity
@Table(name = "paintings")
public class Painting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 120)
    private String artist;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Column(length = 1000)
    private String imageUrl;

    protected Painting() {}

    public Painting(String title, String artist, String description, BigDecimal price, Integer stock, String imageUrl) {
        apply(title, artist, description, price, stock, imageUrl);
    }

    /** Replaces every editable field (full-update semantics, as used by PUT). */
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
