# SDD-004 — Node.js SEA Build (Single Executable Application)

**Impacted UCs:** UC-001
**Impacted BR/WF:** —

## Scope / Non-goals

**Scope:**

- Build a Node.js Single Executable Application (SEA) that embeds the node runtime + app bundle + sql.js WASM binary
- 5-stage Dockerfile: frontend-builder, backend-builder, sea-builder, rootfs, runner
- Scratch-based Alpine distroless runner (`FROM scratch` + musl libs) — preferred per rules §8.3
- Conditional WASM loading in app.module.ts (SEA asset vs filesystem)
- Remove `--external:sql.js` from esbuild (bundle sql.js JS code; WASM embedded as SEA asset)
- Zero `node_modules` at runtime
- Frontend served from `/app/public/browser/` via `process.cwd()` (not `__dirname`)
- HEALTHCHECK using busybox wget (exec form, no shell needed)
- Cross-compilation: JS stages run natively on arm64, SEA + rootfs stages target amd64 via `--platform=linux/amd64`

**Non-goals:**

- Full test suite implementation (separate task)
- CI pipeline changes
- `useCodeCache` — disabled because blob is built on Alpine (linux/amd64) and must be portable

## Acceptance Criteria

- AC-1: `docker compose up --build` succeeds and app serves on configured port
- AC-2: `curl localhost:$APP_PORT/api/health` returns `{"ok":true,...}`
- AC-3: `curl localhost:$APP_PORT/` returns Angular frontend
- AC-4: `curl localhost:$APP_PORT/api/content?lang=ua` returns UA content
- AC-5: No `node_modules` directory exists in the production container
- AC-6: Single binary (`/app/vezha`) contains node + app + WASM
- AC-7: Production image size ~169MB (scratch + musl libs + SEA binary, amd64)
- AC-8: Container runs as non-root user (distroless nonroot, UID 65532)
- AC-9: HEALTHCHECK instruction present and functional (busybox wget, exec form)
- AC-10: Distroless base image — no shell, minimal attack surface

## Security Acceptance Criteria (mandatory)

- SEC-1: Container runs as non-root user — no privilege escalation from container escape
- SEC-2: No dev dependencies in production image — zero node_modules, reduced attack surface
- SEC-3: No `.env` or secrets copied into image (excluded via `.dockerignore`)
- SEC-4: Distroless base — no shell, no package manager, minimal attack surface

## Failure Modes / Error Mapping

- SEA blob generation failure: `node --experimental-sea-config` exits non-zero
- postject injection failure: blob not injected into binary — binary runs as plain node
- WASM loading failure in SEA mode: `sea.getAsset()` returns undefined — fallback to filesystem loading
- esbuild bundle failure without `--external:sql.js`: missing require — verify sql.js bundles correctly as CJS
- strip after postject: MUST strip BEFORE postject — stripping after corrupts injected sections (SIGSEGV)

## Implementation Details

### Conditional WASM loading

`getSqlJsConfig()` helper in `app.module.ts`:
1. Tries `require('node:sea')` — only available in SEA mode
2. If `sea.isSea()` returns true, loads WASM from `sea.getAsset('sql-wasm.wasm')`
3. Falls back to `undefined` (filesystem loading) in dev mode

### esbuild changes

Remove `--external:sql.js` so sql.js JS code gets bundled into the single CJS file.
The WASM binary is NOT bundled by esbuild — it's a SEA asset instead.
Keep other externals (optional NestJS packages, swagger disabled in prod).

### SEA build pipeline

1. `node --experimental-sea-config sea-config.json` generates blob from bundle.js + sql-wasm.wasm
2. Copy node binary, **strip FIRST** (before postject — stripping after corrupts injected ELF sections)
3. Inject blob via `postject`

### Static file serving

`ServeStaticModule` uses `process.cwd()` instead of `__dirname` for the root path.
`process.cwd()` is always `/app` (Docker WORKDIR), making static file resolution reliable.

### Scratch-based Alpine distroless

Runner is built `FROM scratch` with only the minimum libs copied from Alpine:
- `ld-musl-x86_64.so.1` (dynamic linker)
- `libstdc++.so.6` (C++ runtime)
- `libgcc_s.so.1` (GCC runtime)
- `/etc/passwd` + `/etc/group` (nonroot user identity)
- `/tmp` (writable, for runtime needs)
- busybox (static, for HEALTHCHECK only)

No shell, no package manager, no apk — equivalent to distroless.

### Cross-compilation (arm64 dev → amd64 prod)

- JS-only stages (frontend-builder, backend-builder) run natively on arm64 — fast
- Binary stages (sea-builder, rootfs) use `--platform=linux/amd64` — run via QEMU on Docker Desktop
- xsfx compression not viable in cross-compilation (x64 packer can't run on arm64 host via QEMU)

### HEALTHCHECK without shell

HEALTHCHECK uses exec form with busybox (no shell needed):
```dockerfile
HEALTHCHECK CMD ["/usr/local/bin/busybox", "wget", "-qO-", "http://localhost:3000/api/health"]
```

### Image layout

```
/app/
├── vezha          (SEA binary, ~155MB stripped)
├── public/        (frontend)
│   └── browser/
│       ├── index.html
│       └── ...
/usr/local/bin/busybox  (static, for HEALTHCHECK only)
/db/               (data volume, mounted)
```

### Image size breakdown (~169MB, amd64)

| Component | Size |
|-----------|------|
| musl libc + libstdc++ + libgcc | ~4MB |
| SEA binary (stripped node + blob) | ~155MB |
| Frontend dist | ~5MB |
| busybox (static) | ~1.5MB |

## Test Matrix (mandatory)

| AC     | Unit | Integration | Curl Dev | Base UI | UI | Curl Prod API | Prod Fullstack |
|--------|------|-------------|----------|---------|----|---------------|----------------|
| AC-1   | -    | -           | -        | -       | -  | -             | manual         |
| AC-2   | -    | -           | -        | -       | -  | manual        | manual         |
| AC-3   | -    | -           | -        | -       | -  | -             | manual         |
| AC-4   | -    | -           | -        | -       | -  | manual        | manual         |
| AC-5   | -    | -           | -        | -       | -  | -             | manual         |
| AC-6   | -    | -           | -        | -       | -  | -             | manual         |
| AC-7   | -    | -           | -        | -       | -  | -             | manual         |
| AC-8   | -    | -           | -        | -       | -  | -             | manual         |
| AC-9   | -    | -           | -        | -       | -  | -             | manual         |
| AC-10  | -    | -           | -        | -       | -  | -             | manual         |
| SEC-1  | -    | -           | -        | -       | -  | -             | manual         |
| SEC-2  | -    | -           | -        | -       | -  | -             | manual         |
| SEC-3  | -    | -           | -        | -       | -  | -             | manual         |
| SEC-4  | -    | -           | -        | -       | -  | -             | manual         |

Notes:

- Infrastructure-only change (Docker build pipeline). No business logic changes.
- Verification is manual docker compose build + curl checks.
- Distroless chosen per rules §8.3 priority order (preferred over Alpine).
