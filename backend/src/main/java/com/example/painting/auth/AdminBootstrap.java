package com.example.painting.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first administrator from configuration (APP_ADMIN_USERNAME / APP_ADMIN_PASSWORD)
 * when that account does not exist yet. Nothing is created if the settings are empty.
 *
 * Administrators can't sign themselves up, so something has to create the very first one; doing it from
 * configuration keeps the password out of the code and the database migrations.
 * An {@link ApplicationRunner} runs once, after the application has started.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final SecurityProperties.BootstrapAdmin admin;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder, SecurityProperties properties) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.admin = properties.bootstrapAdmin();
    }

    @Override
    public void run(ApplicationArguments args) {
        // Not configured: do nothing (the normal case in production after the first admin exists).
        if (admin == null || !admin.configured()) return;
        String username = AuthService.normalise(admin.username());
        // Already there (e.g. a restart with a persistent database): keep it, never overwrite its password.
        if (users.existsByUsername(username)) return;
        users.save(new AppUser(username, passwordEncoder.encode(admin.password()), Role.ADMIN));
        log.info("Created bootstrap administrator '{}'", username); // the password is never logged
    }
}
