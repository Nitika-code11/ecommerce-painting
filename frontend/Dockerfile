# syntax=docker/dockerfile:1
#
# Frontend image (React app served by nginx). Two stages:
#   1. "build"   - Node compiles the app into plain static files (HTML, JS, CSS) in /app/dist.
#   2. the final - nginx serves those files and forwards /api/* to the backend.
# Node and node_modules never reach the final image.
#
# Build:  docker build -t painting-frontend ./frontend
# Run:    see ../docker-compose.yml

# ---------- Stage 1: build the static site ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (cached until package files change). `npm ci` installs exactly what package-lock.json says.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time settings (Vite inlines these into the JavaScript, so they are public and fixed at build time).
#  - VITE_API_BASE_URL empty  => the browser calls /api on the same origin, which nginx forwards to the backend.
#  - VITE_ENABLE_MUTATIONS=false => build a read-only site with no sign-in or admin screens.
ARG VITE_API_BASE_URL=""
ARG VITE_ENABLE_MUTATIONS="true"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_MUTATIONS=$VITE_ENABLE_MUTATIONS

# Type-checks (tsc) and bundles into /app/dist.
RUN npm run build

# ---------- Stage 2: serve it ----------
# The "unprivileged" nginx image runs as a normal user and listens on 8080 (not 80), so it needs no root rights.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Where /api/* requests are forwarded. In docker-compose the backend is reachable by its service name.
# nginx's entrypoint fills ${BACKEND_URL} into the template at startup, so the same image works in any environment.
ENV BACKEND_URL=http://backend:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Healthy once nginx serves the home page.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1
