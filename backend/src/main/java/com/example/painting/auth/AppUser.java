package com.example.painting.auth;

import jakarta.persistence.*;

/**
 * An account that can sign in: one row of the {@code users} table (V2 migration).
 * The table is named "users" because "user" is a reserved word in SQL.
 */
@Entity
@Table(name = "users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Always stored lower-case, which makes the unique constraint case-insensitive. */
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    /** BCrypt hash. The plain password is never stored anywhere. */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    /** Saved as text ("ADMIN") rather than an ordinal, so reordering the enum can't change existing accounts. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Required by JPA; application code uses the public constructor. */
    protected AppUser() {}

    public AppUser(String username, String passwordHash, Role role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
}
