# SDD-002 — UX Improvements: Static Page Layout, Leads API Fix, Browser Lang Detection, Referrer Tracking

**Impacted UCs:** UC-001, UC-002, UC-003, UC-005, UC-006, UC-015
**Impacted BR/WF:** BR-001, WF-001, WF-006

## Scope

- Redesign static page to plain readable text layout (remove card container)
- Remove redundant "Back to home" nav link from static page (logo already links home)
- Fix admin leads section API routing issue (reorder routes, fix `@Res()` usage)
- Add browser language auto-detection via `navigator.language`
- Add `referrer` field to lead tracking (entity, DTO, frontend, CSV export)

## Non-goals

- No new API endpoints beyond existing modification
- No UI test changes (visual-only static page change)
- No admin panel UI changes for referrer display (data available in CSV export and API response)

## Acceptance Criteria

- AC-1: Static page renders plain header (logo + lang switch) + readable body text without card wrapper
- AC-2: Static page "Back to home" nav link removed; logo links to home
- AC-3: Static page text uses clamp-based font sizes for readability (min 1.05rem)
- AC-4: Admin leads section loads without API errors when switching tabs
- AC-5: `GET /api/admin/leads/export` returns CSV with `referrer` column
- AC-6: Landing page auto-detects browser language and loads matching locale
- AC-7: Static page auto-detects browser language when no `?lang=` param present
- AC-8: Browser lang detection falls back to `en` when no supported locale matches
- AC-9: `POST /api/leads` accepts optional `referrer` field (max 500 chars)
- AC-10: Frontend captures `document.referrer` on lead submission
- AC-11: Lead entity includes `referrer` column (nullable, auto-migrated by TypeORM)

## Security Acceptance Criteria

- SEC-1: `referrer` field is validated (string, max 500 chars) — no injection risk
- SEC-2: Browser language detection uses only `navigator.language` — no user-controlled input
- SEC-3: `@Res({ passthrough: true })` maintains NestJS exception filter chain for leads/export

## Failure Modes / Error Mapping

| Scenario                          | Behavior                                    |
|-----------------------------------|---------------------------------------------|
| Browser lang not in active locales | Falls back to 'en'                          |
| navigator undefined (SSR)         | Falls back to 'en'                          |
| Referrer empty/undefined          | Stored as null in DB                        |
| Referrer exceeds 500 chars        | 400 validation error from class-validator   |
| Leads API token missing           | 401 Unauthorized                            |

## Test Matrix

| AC     | Unit | Integration | Curl Dev | Base UI | UI | Curl Prod API | Prod Fullstack |
|--------|------|-------------|----------|---------|----|---------------|----------------|
| AC-1   | -    | -           | -        | -       | -  | -             | -              |
| AC-4   | -    | -           | -        | -       | -  | -             | -              |
| AC-6   | -    | -           | -        | -       | -  | -             | -              |
| AC-9   | -    | -           | -        | -       | -  | -             | -              |
| AC-11  | -    | -           | -        | -       | -  | -             | -              |
| SEC-1  | -    | -           | -        | -       | -  | -             | -              |

## Changes Made

### Files Modified

- `frontend/src/app/static-page/static-page.component.html` — Removed card wrapper, nav-pill; plain text layout
- `frontend/src/app/static-page/static-page.component.scss` — Rewritten for plain readable style
- `backend/src/admin/admin.controller.ts` — Reordered leads/export before leads/:id/bad; `@Res({ passthrough: true })`
- `backend/src/lead/lead.entity.ts` — Added `referrer` column (nullable)
- `backend/src/lead/dto/create-lead.dto.ts` — Added `referrer` field with validation
- `frontend/src/app/landing/landing.component.ts` — Browser lang detection; referrer capture on lead submit
- `frontend/src/app/static-page/static-page.component.ts` — Browser lang detection
- `frontend/src/app/services/lead.service.ts` — Added `referrer` to `LeadPayload` type
- `frontend/src/app/models/lead.model.ts` — Added `referrer` to `Lead` type
