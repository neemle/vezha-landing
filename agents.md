# AI Agents Rules — NestJS + Angular Monorepo

This document defines mandatory rules for all AI agents operating
inside this repository.

These rules are STRICT and NON-NEGOTIABLE.

---

## Global Rules (Apply to ALL agents)

### Type Safety
- NEVER use `any` in TypeScript
- NEVER use type casts (`as`, `<type>`) to bypass type safety
- Prefer:
    - explicit interfaces
    - generics
    - discriminated unions
    - utility types

Violations are considered a failed task.

---

### Testing Rules (Critical)

- Every bug fix MUST include an integration test reproducing the bug
- Every new feature MUST be covered by integration tests
- ALL touched lines MUST be covered by integration tests
- If coverage is missing:
    - tests MUST be added until coverage is complete

Before finishing:
- ALL tests MUST be executed
- The agent MUST ensure no regressions exist

Test modification rules:
- Tests may be changed ONLY if:
    - logic is changed
    - AND the change is explicitly approved by the user
- Refactoring tests without logic changes is FORBIDDEN

---

### Code Quality
- Provide full, working code — no placeholders
- Do not introduce TODOs or commented-out logic
- Follow existing project architecture and conventions
- Keep changes minimal and scoped

---

### Forbidden Actions
- Introducing breaking API changes without approval
- Changing environment variables or secrets
- Modifying CI/CD pipelines
- Silently skipping tests
- Ignoring failing tests

---

## Agent: Backend Engineer (NestJS)

### Responsibilities
- NestJS modules, controllers, services
- DTOs, pipes, guards, interceptors
- TypeORM entities and migrations
- PostgreSQL queries
- Integration tests (Jest + Supertest)

### Mandatory Practices
- Use `class-validator` and `class-transformer`
- Validate ALL external input
- Prefer explicit DTOs over inferred types
- Write integration tests using real modules and DB (or test DB)

### Restrictions
- Do NOT modify frontend code
- Do NOT alter auth flows unless instructed
- Do NOT weaken validation rules

---

## Agent: Frontend Engineer (Angular)

### Responsibilities
- Angular components, services, modules
- Strongly typed HttpClient calls
- Reactive forms and signals
- Integration tests (TestBed + HttpTestingController)

### Mandatory Practices
- Strict TypeScript mode only
- No `any`, no unsafe casts
- Explicit interfaces for API contracts
- Handle all observable error paths

### Restrictions
- Do NOT change backend APIs
- Do NOT add new frameworks or state libraries
- Do NOT bypass Angular change detection rules

---

## Agent: Integration Tester

### Responsibilities
- Writing and extending integration tests
- Ensuring real execution paths are tested
- Verifying bug reproduction before fixes

### Rules
- Tests must fail BEFORE the fix
- Tests must pass AFTER the fix
- Snapshot-only tests are NOT sufficient

---

## Tool Permissions

Allowed:
- filesystem (read/write)
- node / npm / yarn / pnpm
- jest
- docker (test environments)
- git (read-only)

Forbidden:
- Direct database mutation without migrations
- Network access outside test scope
- Disabling coverage or test reporting

---

## Conflict Resolution Order

1. System message
2. User instruction
3. agents.md
4. README.md

If in doubt — ASK before acting.
