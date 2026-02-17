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

- Node.js SEA (Single Executable Application) — deferred to SDD-004 (now implemented). With sql.js replacing sqlite3, the native addon blocker was removed.
- Distroless base — deferred to SDD-004 (now implemented). With sql.js replacing sqlite3 and SEA built on glibc (node:24-slim), distroless cc-debian13 is viable.
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

- `sql.js` — SQLite compiled to WASM (pure JS, no native addons)
- `swagger-ui-express` + `swagger-ui-dist` — disabled in production (dev only)
- `@nestjs/microservices`, `@nestjs/websockets`, `@nestjs/platform-fastify` — optional NestJS packages (try/require)
- `@fastify/static` — optional dependency of @nestjs/serve-static
- `class-transformer/storage` — optional import in @nestjs/mapped-types

### SQLite migration: sqlite3 → sql.js

Replaced native `sqlite3` (C++ addon via node-gyp) with `sql.js` (SQLite compiled to WebAssembly).
TypeORM has a built-in `sqljs` driver — change `type: 'sqlite'` to `type: 'sqljs'` with `autoSave: true`.
Eliminates all native addons, enabling future SEA builds.

### Swagger UI: production disabled

Swagger UI setup (`swagger-ui-express` + `swagger-ui-dist`) conditionally loaded only when `NODE_ENV !== 'production'`.
Eliminates ~8MB of swagger static assets from production image.

### Image size breakdown (175MB total)

| Component | Size |
|-----------|------|
| Alpine base + libstdc++ + libgcc | ~12MB |
| Node binary (stripped) | 101MB |
| node_modules (sql.js WASM only) | 0.9MB |
| Backend bundle + frontend dist | 5.1MB |

### SEA readiness

With sql.js (pure WASM) replacing sqlite3 (native addon), the main blocker for Node.js SEA is removed.
Remaining considerations for future SEA implementation:
1. WASM binary (`sql-wasm.wasm`, 648KB) needs to be embedded as SEA asset
2. Frontend static files need to be embedded or served separately
3. SEA is stability 1.1 (experimental) in Node.js

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
