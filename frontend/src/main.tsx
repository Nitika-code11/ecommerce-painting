// Browser entry point: mounts the React app into the <div id="root"> found in index.html.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css"; // global styles (Tailwind + design tokens)

createRoot(document.getElementById("root")!).render(
  // StrictMode adds extra development-only checks (e.g. runs effects twice to expose bugs); it has no effect in production.
  <StrictMode>
    <App />
  </StrictMode>,
);
