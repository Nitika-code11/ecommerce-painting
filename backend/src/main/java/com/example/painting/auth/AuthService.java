package com.example.painting.auth;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** The sign-up and sign-in use cases. */
@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    /** Checked when the username is unknown so both failure paths cost the same BCrypt work (no timing hint). */
    private final String unknownUserHash;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwt) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        // Hash a throwaway password once so we always have a valid BCrypt hash to compare against.
        this.unknownUserHash = passwordEncoder.encode("not-a-real-password");
    }

    /** Self-service sign-up always creates a CUSTOMER; administrators are provisioned separately. */
    @Transactional
    public RegisteredUser register(Credentials.Register request) {
        String username = normalise(request.username());
        if (users.existsByUsername(username)) throw new UsernameTakenException(username);
        try {
            // saveAndFlush sends the INSERT now, so a duplicate is detected inside this try block.
            AppUser saved = users.saveAndFlush(new AppUser(username, passwordEncoder.encode(request.password()), Role.CUSTOMER));
            return new RegisteredUser(saved.getUsername(), saved.getRole());
        } catch (DataIntegrityViolationException raceOnUniqueUsername) {
            // Two sign-ups for the same name raced past the check above; the database's unique constraint caught it.
            throw new UsernameTakenException(username);
        }
    }

    /** Checks the credentials and, if they are right, returns a signed access token. */
    @Transactional(readOnly = true)
    public TokenResponse login(Credentials.Login request) {
        AppUser user = users.findByUsername(normalise(request.username())).orElse(null);
        // Always run one BCrypt comparison, even for an unknown user, so response time doesn't reveal which names exist.
        boolean matches = passwordEncoder.matches(request.password(), user != null ? user.getPasswordHash() : unknownUserHash);
        if (user == null || !matches) {
            // One message for "no such user" and "wrong password" so accounts cannot be enumerated.
            throw new BadCredentialsException("Invalid username or password");
        }
        return jwt.issue(user);
    }

    /** Usernames are compared case-insensitively by storing and looking them up in lower case. */
    static String normalise(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
