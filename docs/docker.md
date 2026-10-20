# Running the application in Docker

Docker packages each part of the app, with everything it needs, into an **image**; a running copy of an image is a
**container**. Anyone with Docker gets the same result on any machine, with no JDK, Node or Maven installed.

> **Status:** the Docker files are written and their YAML syntax is checked, but they have **not been built on a
> machine with Docker yet** (Docker was not installed on the development computer). The `docker` job in
> [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) builds the images and smoke-tests the running stack on every
> push, so a green CI run is the first real proof. Expect to fix small things on the first local run.

## What is in the setup

| File | Purpose |
| --- | --- |
| [`backend/Dockerfile`](../backend/Dockerfile) | Builds the API jar with a JDK, then ships it in a small JRE image that runs as a non-root user and has a health check. |
| [`frontend/Dockerfile`](../frontend/Dockerfile) | Builds the React app with Node, then serves the static files from nginx. |
| [`frontend/nginx/`](../frontend/nginx) | nginx config: serves the SPA (unknown URLs fall back to `index.html`), forwards `/api/*` to the backend, caches built assets, adds security headers. |
| [`docker-compose.yml`](../docker-compose.yml) | Starts both containers together, wired to each other. |
| [`.env.example`](../.env.example) | Settings you can override (profile, secrets). Copy to `.env`. |
| `*/.dockerignore` | Keeps `node_modules`, `target`, secrets etc. out of the build. |

```text
 your browser ──► localhost:3000  frontend container (nginx)
                                     │  /api/*  (internal Docker network)
                                     ▼
                  localhost:8080  backend container (Spring Boot, H2 in memory)
```

## One-time setup on Windows 11

1. **Check virtualization is on** (Task Manager → Performance → CPU shows *Virtualization: Enabled*). If not, enable it
   in the BIOS/UEFI.
2. **Install WSL 2**, the Linux layer Docker Desktop uses. In an *administrator* PowerShell:
   ```powershell
   wsl --install
   ```
   Restart the computer when asked.
3. **Install Docker Desktop**:
   ```powershell
   winget install Docker.DockerDesktop
   ```
   (or download it from docker.com). Accept the licence (it is free for personal use and small businesses; larger
   companies need a paid subscription). Start Docker Desktop and wait until it says *Engine running*.
4. **Check it works** in a new terminal:
   ```powershell
   docker --version
   docker compose version
   docker run --rm hello-world
   ```

## Run the whole app

From the repository root:

```powershell
docker compose up --build
```

The first build takes several minutes (it downloads Maven and npm dependencies; later builds are cached). When the
logs settle:

| What | Where |
| --- | --- |
| The application | http://localhost:3000 |
| API directly | http://localhost:8080/api/paintings |
| API documentation (Swagger UI) | http://localhost:8080/swagger-ui.html |
| Administrator sign-in (dev profile only) | `admin` / `admin12345` |

Useful commands:

```powershell
docker compose up -d --build      # same, but in the background
docker compose ps                 # state and health of each container
docker compose logs -f backend    # follow one service's logs (Ctrl+C stops following, not the app)
docker compose down               # stop and remove the containers
docker compose build --no-cache   # rebuild from scratch if something looks stale
```

Build or run a single image by hand:

```powershell
docker build -t painting-backend ./backend
docker run --rm -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev painting-backend
```

## Two ways to run: dev and production-like

| | `dev` (default in compose) | production-like |
| --- | --- | --- |
| Sample paintings | yes | no (empty catalogue) |
| Swagger UI / H2 console | yes | no |
| Administrator | `admin` / `admin12345` (public, throwaway) | the one you configure |
| Signing key | built-in dev key | **you must provide `APP_JWT_SECRET`** |

For the production-like run, copy `.env.example` to `.env` and set:

```text
SPRING_PROFILES_ACTIVE=prod
APP_JWT_SECRET=<32+ random characters, e.g. from: openssl rand -base64 48>
APP_ADMIN_USERNAME=<your admin name>
APP_ADMIN_PASSWORD=<a strong password>
```

then `docker compose up --build`. If `APP_JWT_SECRET` is missing the backend exits at startup with a clear message
instead of running with a weak key; that is intentional. The image itself defaults to the non-dev behaviour, so
running it without any settings is safe.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `docker: command not found` | Docker Desktop is not installed, or the terminal was opened before installing. Open a new one. |
| `error during connect ... pipe/dockerDesktopLinuxEngine` | Docker Desktop is not running. Start it and wait for *Engine running*. |
| Backend container keeps restarting | `docker compose logs backend`. Usually `APP_JWT_SECRET` is missing or shorter than 32 bytes. |
| `port is already allocated` | Something else uses 3000 or 8080 (for example the `npm run dev` or `mvnw spring-boot:run` you started earlier). Stop it, or change the left-hand port in `docker-compose.yml`. |
| Frontend shows "Couldn't reach the server" | The backend is not healthy yet or crashed: `docker compose ps` and check its logs. |
| `mvnw: not found` / `bad interpreter` during build | A Windows line-ending problem. The Dockerfile already strips `\r`; if it persists, run `git add --renormalize .`. |

## Before using these images for real

- **Data is lost on restart.** The database is in-memory H2. A real deployment needs PostgreSQL (roadmap, Phase 6).
- **Publish images to a registry** (GitHub Container Registry or Amazon ECR) from CI, tagged with the commit, and
  deploy that exact image, rather than building on the server.
- **Scan images** for known vulnerabilities (for example Trivy or Docker Scout) as a CI step.
- **TLS and a Content-Security-Policy** belong in front of the app (load balancer or reverse proxy). The nginx config
  sets basic security headers but no CSP yet, because the app loads Google Fonts and external painting images and a
  policy must be tested in a browser against both.
- **Secrets** come from the platform (AWS Secrets Manager, GitHub environment secrets), never from files in git.
