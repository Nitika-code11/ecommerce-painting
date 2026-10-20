package com.example.painting.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** Database access for accounts; Spring Data generates the implementation from the method names. */
public interface UserRepository extends JpaRepository<AppUser, Long> {
    /** Looks an account up by its (lower-case) username; empty if there is none. */
    Optional<AppUser> findByUsername(String username);

    /** Cheap existence check used before creating an account. */
    boolean existsByUsername(String username);
}
