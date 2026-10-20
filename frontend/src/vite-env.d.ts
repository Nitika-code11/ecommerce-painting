/// <reference types="vite/client" />

// Type declarations for the build-time settings the app reads from import.meta.env.
// Vite only exposes variables whose names start with VITE_, and inlines them into the bundle (so they are public).
interface ImportMetaEnv {
  /** Backend origin for production builds (empty in development, where the Vite proxy is used). */
  readonly VITE_API_BASE_URL?: string;
  /** Set to "false" to hide sign-in and the create/edit/delete screens (e.g. a read-only public deployment). */
  readonly VITE_ENABLE_MUTATIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
