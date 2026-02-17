# SDD-003 — Docker Image Optimization + Card Hover Effect + Favicon

**Impacted UCs:** UC-001
**Impacted BR/WF:** —

## Scope / Non-goals

**Scope:**

- Optimize production Docker image from ~481MB to <200MB via 4-stage build with bare Alpine runner
- esbuild bundling + tree-shaking + minification of NestJS backend (64MB node_modules -> 8.5MB)
- Stripped node binary (119MB -> 101MB)
- Add `.dockerignore` to reduce build context
- Add `.env` with configurable `APP_PORT` (rules §8.1)
- Migrate dev volume from `./db` to `./.dev-data/db` (rules §8.2)
- Non-root user + HEALTHCHECK (rules §8.3)
- Card hover effect: rotation (odd: -2deg, even: +3deg) + olive-dark background + white text (from Figma screenshot)
- CTA button wave animation (radial pulse every 3 seconds)
- SVG favicon with light/dark theme support via `prefers-color-scheme`

**Non-goals:**

- Node.js SEA (Single Executable Application) — not viable: sqlite3 native addon must remain on disk, swagger-ui-express serves static files from node_modules, and the app serves frontend files from disk. SEA is designed for self-contained CLI tools, not web servers with external file dependencies.
- Distroless base — not viable: sqlite3 native addon requires musl libc + libstdc++ from Alpine; distroless nodejs images are glibc-based Debian, causing ABI mismatch.
- Full test suite implementation (separate task)
- CI pipeline changes

## Acceptance Criteria

- AC-1: `docker compose up --build` succeeds and app serves on configured port
- AC-2: `curl localhost:$APP_PORT/api/health` returns `{"ok":true,...}`
- AC-3: Production image size < 200MB (achieved: 187MB)
- AC-4: Container runs as non-root user (UID 1001)
- AC-5: HEALTHCHECK instruction present and functional
- AC-6: `.dockerignore` excludes node_modules, .git, docs, build artifacts
- AC-7: Ports configurable via `.env` only — no hardcoded ports in docker-compose.yml
- AC-8: Dev volume uses `./.dev-data/db`
- AC-9: Cards rotate on hover with olive-dark background + white text
- AC-10: CTA buttons show wave/pulse animation every 3 seconds
- AC-11: SVG favicon adapts to light/dark theme

## Security Acceptance Criteria (mandatory)

- SEC-1: Container runs as non-root user — no privilege escalation from container escape
- SEC-2: No dev dependencies (typescript, ts-node, eslint, etc.) in production image — reduced attack surface
- SEC-3: No `.env` or secrets copied into image (excluded via `.dockerignore`)

## Failure Modes / Error Mapping

- Build failure: Docker build exits non-zero if any stage fails
- sqlite3 native module crash: would indicate missing libstdc++/libgcc — tested by health check
- esbuild bundle failure: missing external declaration — add the package to externals list
- Port conflict: user changes `APP_PORT` in `.env`

## Implementation Details

### esbuild bundling strategy

After `nest build` (tsc), esbuild bundles the compiled JS into a single minified file (3.4MB).
Externals (must remain in node_modules at runtime):

- `sqlite3` — native addon (.node binary)
- `swagger-ui-express` + `swagger-ui-dist` — serves static HTML/CSS/JS from package dir
- `@nestjs/microservices`, `@nestjs/websockets`, `@nestjs/platform-fastify` — optional NestJS packages (try/require)
- `@fastify/static` — optional dependency of @nestjs/serve-static
- `class-transformer/storage` — optional import in @nestjs/mapped-types

### Image size breakdown (187MB total)

| Component | Size |
|-----------|------|
| Alpine base + libstdc++ + libgcc | ~12MB |
| Node binary (stripped) | 101MB |
| node_modules (sqlite3 + swagger-ui only) | 8.5MB |
| Backend bundle + frontend dist | 5.1MB |

### Why not SEA

Node.js SEA requires all code embedded in the binary. This app has:

1. sqlite3 native `.node` addon — must be loaded from disk via `process.dlopen()`
2. swagger-ui-express — reads static HTML/CSS/JS from `swagger-ui-dist` on disk
3. Frontend static files — served from disk by @nestjs/serve-static
4. SEA is stability 1.1 (experimental)

The esbuild bundling alone reduced node_modules from 64MB to 8.5MB, achieving the same practical benefit.

## Test Matrix (mandatory)

| AC     | Unit | Integration | Curl Dev | Base UI | UI | Curl Prod API | Prod Fullstack |
|--------|------|-------------|----------|---------|----|---------------|----------------|
| AC-1   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-2   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ✅             | ✅              |
| AC-3   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-4   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-5   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-6   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-7   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-8   | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| AC-9   | ⬜    | ⬜           | ⬜        | ✅       | ✅  | ⬜             | ✅              |
| AC-10  | ⬜    | ⬜           | ⬜        | ✅       | ✅  | ⬜             | ✅              |
| AC-11  | ⬜    | ⬜           | ⬜        | ✅       | ✅  | ⬜             | ✅              |
| SEC-1  | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| SEC-2  | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |
| SEC-3  | ⬜    | ⬜           | ⬜        | ⬜       | ⬜  | ⬜             | ✅              |

Notes:

- Alpine bare chosen over distroless per §8.3 — distroless not viable because sqlite3 native addon is compiled against musl (Alpine) during `npm ci`; copying it to glibc-based distroless Debian would cause dynamic linker failures.
- "✅" means meaningful assertions (status + body + outcome; UI interaction + baseline compare).
