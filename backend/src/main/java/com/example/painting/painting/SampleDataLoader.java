package com.example.painting.painting;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/** Seeds a sample gallery of public-domain artworks (images from Wikimedia Commons) when the database is empty. Dev profile only. */
@Component
@Profile("dev")
public class SampleDataLoader implements CommandLineRunner {
    private static final String COMMONS = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";

    private final PaintingRepository repository;

    public SampleDataLoader(PaintingRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;

        repository.saveAll(List.of(
            painting("The Starry Night", "Vincent van Gogh", "2499.00", 5,
                "A swirling night sky over a quiet village, painted from memory in 1889. Restless blues and glowing yellows make it one of the most recognisable works in modern art.",
                "0/01/Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/960px-Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"),
            painting("The Great Wave off Kanagawa", "Katsushika Hokusai", "1899.00", 8,
                "The iconic woodblock print of a towering wave framing Mount Fuji, from the series Thirty-six Views of Mount Fuji (c. 1831).",
                "0/0a/The_Great_Wave_off_Kanagawa.jpg/960px-The_Great_Wave_off_Kanagawa.jpg"),
            painting("Girl with a Pearl Earring", "Johannes Vermeer", "3299.00", 3,
                "Often called the Mona Lisa of the North, this tronie (c. 1665) captures a luminous glance over the shoulder against a dark background.",
                "0/0f/1665_Girl_with_a_Pearl_Earring.jpg/960px-1665_Girl_with_a_Pearl_Earring.jpg"),
            painting("Impression, Sunrise", "Claude Monet", "2799.00", 4,
                "The 1872 harbour scene of Le Havre that gave Impressionism its name, dissolving the orange sun and morning mist into loose, atmospheric brushwork.",
                "5/59/Monet_-_Impression%2C_Sunrise.jpg/960px-Monet_-_Impression%2C_Sunrise.jpg"),
            painting("Water Lilies", "Claude Monet", "2299.00", 6,
                "From Monet's garden at Giverny, a tranquil study of light on water and floating blossoms painted in 1906.",
                "a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/960px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg"),
            painting("Sunflowers", "Vincent van Gogh", "2199.00", 7,
                "A vase of sunflowers in every stage of bloom, painted in Arles in 1888 to brighten a friend's bedroom with thick, golden impasto.",
                "9/9d/Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg/960px-Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg"),
            painting("The Kiss", "Gustav Klimt", "3499.00", 2,
                "Gold leaf and ornate pattern wrap two embracing figures in this centrepiece of the Vienna Secession (1907-08).",
                "f/f3/Gustav_Klimt_016.jpg/960px-Gustav_Klimt_016.jpg"),
            painting("The Scream", "Edvard Munch", "2699.00", 3,
                "An anguished figure on a bridge beneath a blood-orange sky, the defining image of existential dread (1893).",
                "8/86/Edvard_Munch_-_The_Scream_-_Google_Art_Project.jpg/960px-Edvard_Munch_-_The_Scream_-_Google_Art_Project.jpg"),
            painting("A Sunday on La Grande Jatte", "Georges Seurat", "2899.00", 0,
                "Thousands of tiny dots of colour build a leisurely riverside afternoon in Seurat's pointillist masterpiece (1884-86).",
                "b/b7/Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg/960px-Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg"),
            painting("Wanderer above the Sea of Fog", "Caspar David Friedrich", "2599.00", 4,
                "A lone traveller gazes over a misty mountain landscape, a defining image of Romanticism (c. 1818).",
                "b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/960px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg")
        ));
    }

    private static Painting painting(String title, String artist, String price, int stock, String description, String imagePath) {
        return new Painting(title, artist, description, new BigDecimal(price), stock, COMMONS + imagePath);
    }
}
