package com.example.painting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the API.
 *
 * {@code @SpringBootApplication} turns on three things at once: component scanning of this package and
 * everything below it (controllers, services, configuration classes), Spring Boot auto-configuration
 * (web server, JPA, Flyway, security ... based on the libraries on the classpath), and this class
 * itself as a source of bean definitions.
 */
@SpringBootApplication
public class PaintingEcommerceApplication {
    public static void main(String[] args) {
        // Starts the embedded web server and the whole application context.
        SpringApplication.run(PaintingEcommerceApplication.class, args);
    }
}
