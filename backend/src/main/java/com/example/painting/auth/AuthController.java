package com.example.painting.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** HTTP endpoints for creating an account and signing in. Both are public (see SecurityConfig). */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Create a customer account and obtain an access token.")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    /** Exchanges a username and password for a JWT. Wrong credentials give 401 with a deliberately vague message. */
    @PostMapping("/login")
    @Operation(summary = "Sign in and receive an access token")
    public TokenResponse login(@Valid @RequestBody Credentials.Login request) {
        return service.login(request);
    }

    /** Creates a CUSTOMER account (201), or 409 if the username is taken, or 400 if the input breaks the rules. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a customer account")
    public RegisteredUser register(@Valid @RequestBody Credentials.Register request) {
        return service.register(request);
    }
}
