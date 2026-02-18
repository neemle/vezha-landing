# SDD-005 — Fix DB Permissions for Non-Root Runtime

**Impacted UCs:** UC-001
**Impacted BR/WF:** BR-005, WF-001

## Scope / Non-goals

**Scope:**

- Fix container startup failure caused by `EACCES` when opening `/db/vezha.sqlite` under non-root runtime
- Ensure runtime image pre-creates `/db` and assigns ownership to UID/GID `65532`
- Keep runtime non-root execution unchanged

**Non-goals:**

- No business/API behavior changes
- No schema/data model changes
- No CI pipeline changes

## Acceptance Criteria

- AC-1: Container starts successfully with `DB_PATH=/db/vezha.sqlite`
- AC-2: Health endpoint responds after startup (`GET /api/health`)
- AC-3: Runtime still runs as non-root user (`UID 65532`)
- AC-4: No regression in image startup command/binary execution

## Security Acceptance Criteria (mandatory)

- SEC-1: Container keeps non-root execution (no fallback to root)
- SEC-2: Writable scope is limited to `/db` for persisted data
- SEC-3: Fix does not require adding shell/package manager to runtime beyond existing base

## Failure Modes / Error Mapping

- If `/db` ownership is incorrect, app logs `EACCES: permission denied, open '/db/vezha.sqlite'` and TypeORM retries
- If binary execution regresses, container exits before health endpoint is available

## Test Matrix (mandatory)

| AC/SEC | Unit | Integration | Curl Dev | Base UI | UI | Curl Prod API | Prod Fullstack |
|-------|------|-------------|----------|---------|----|---------------|----------------|
| AC-1  | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| AC-2  | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| AC-3  | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| AC-4  | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| SEC-1 | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| SEC-2 | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |
| SEC-3 | ⬜    | ⬜           | ✅        | ⬜       | ⬜  | ✅             | ✅              |

Notes:

- Infrastructure-only fix; verification is container startup logs + health endpoint + user identity check.
