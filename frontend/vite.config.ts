/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Build, dev-server and test configuration (one file serves Vite and Vitest).
//
// In development, /api is proxied to the Spring Boot backend so the browser
// never makes a cross-origin request. (The backend also allows the dev origin via CORS.)
export default defineConfig({
  plugins: [
    react(),       // JSX/TSX support and fast refresh
    tailwindcss(), // Tailwind CSS v4 integration
  ],
  resolve: {
    // "@/foo" means "src/foo", which avoids long "../../.." import paths.
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    proxy: {
      // Any request to /api/... made against the dev server is forwarded to the backend.
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8080", // override with API_PROXY_TARGET
        changeOrigin: true, // rewrite the Host header to match the target
      },
    },
  },
  // Vitest (unit/component tests) settings.
  test: {
    environment: "jsdom",                 // simulate a browser DOM in Node
    globals: true,                        // describe/it/expect available without imports
    setupFiles: ["./src/test/setup.ts"],  // runs before each test file (matchers, cleanup)
    css: false,                           // skip processing CSS, which tests don't need
  },
});
