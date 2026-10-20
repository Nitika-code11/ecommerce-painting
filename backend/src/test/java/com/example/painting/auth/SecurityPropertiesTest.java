package com.example.painting.auth;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Plain unit tests of the configuration validation: a bad security configuration must stop the app at startup. */
class SecurityPropertiesTest {
    /** No secret, or one shorter than 32 bytes, is refused with a message naming the setting to fix. */
    @Test
    void aMissingOrShortSigningSecretFailsFast() {
        assertThatThrownBy(() -> new SecurityProperties.Jwt(null, null)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new SecurityProperties.Jwt("too-short", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    /** If no lifetime is configured, tokens last 60 minutes. */
    @Test
    void tokenLifetimeDefaultsToAnHour() {
        assertThat(new SecurityProperties.Jwt("x".repeat(32), null).ttl()).isEqualTo(Duration.ofHours(1));
    }

    /** An admin is only created when BOTH a username and a password are configured. */
    @Test
    void bootstrapAdminNeedsBothUsernameAndPassword() {
        assertThat(new SecurityProperties.BootstrapAdmin("admin", "secret-pw").configured()).isTrue();
        assertThat(new SecurityProperties.BootstrapAdmin("admin", "").configured()).isFalse();
        assertThat(new SecurityProperties.BootstrapAdmin("", "secret-pw").configured()).isFalse();
        assertThat(new SecurityProperties.BootstrapAdmin(null, null).configured()).isFalse();
    }
}
