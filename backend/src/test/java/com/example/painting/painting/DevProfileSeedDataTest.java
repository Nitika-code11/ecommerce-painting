package com.example.painting.painting;

import com.example.painting.auth.Role;
import com.example.painting.auth.UserRepository;
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
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;

    /** The ten sample paintings from db/dev/V1000 are present and all have an https image. */
    @Test
    void sampleGalleryIsLoaded() {
        assertThat(repository.count()).isEqualTo(10);
        assertThat(repository.findAll()).allSatisfy(p -> assertThat(p.getImageUrl()).startsWith("https://"));
    }

    /** Flyway's own history table shows exactly the schema migrations (1, 2) and the dev seed (1000), in order. */
    @Test
    void schemaAndSeedMigrationsBothRan() {
        var versions = jdbc.queryForList(
                "SELECT \"version\" FROM \"flyway_schema_history\" WHERE \"success\" = TRUE AND \"version\" IS NOT NULL ORDER BY \"installed_rank\"",
                String.class);

        assertThat(versions).containsExactly("1", "2", "1000");
    }

    /** The dev profile creates the "admin" account with the ADMIN role and a hashed (not plain) password. */
    @Test
    void theDevAdministratorIsBootstrappedWithAHashedPassword() {
        var admin = users.findByUsername("admin").orElseThrow();

        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.getPasswordHash()).startsWith("$2").isNotEqualTo("admin12345");
    }
}
