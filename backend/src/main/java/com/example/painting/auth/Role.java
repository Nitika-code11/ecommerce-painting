package com.example.painting.auth;

/**
 * What an account is allowed to do.
 *  - CUSTOMER: can browse (browsing is public anyway) and, later, shop. Created through self-service sign-up.
 *  - ADMIN: can also create, update and delete paintings. Never created through sign-up.
 * Stored by name in the users table (see the CHECK constraint in V2__create_users.sql).
 */
public enum Role {
    CUSTOMER,
    ADMIN
}
