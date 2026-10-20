package com.example.painting.painting;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/** The dev profile applies the schema migration plus the db/dev sample-data migration. */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:devseedtest;DB_CLOSE_DELAY=-1")
@ActiveProfiles("dev")
class DevProfileSeedDataTest {
    @Autowired PaintingRepository repository;
    @Autowired JdbcTemplate jdbc;

    @Test
    void sampleGalleryIsLoaded() {
        assertThat(repository.count()).isEqualTo(10);
        assertThat(repository.findAll()).allSatisfy(p -> assertThat(p.getImageUrl()).startsWith("https://"));
    }

    @Test
    void schemaAndSeedMigrationsBothRan() {
        var versions = jdbc.queryForList(
                "SELECT \"version\" FROM \"flyway_schema_history\" WHERE \"success\" = TRUE AND \"version\" IS NOT NULL ORDER BY \"installed_rank\"",
                String.class);

        assertThat(versions).containsExactly("1", "1000");
    }
}
