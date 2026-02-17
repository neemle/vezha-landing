# SDD-001 — Apply Figma Design to Landing Page

**Impacted UCs:** UC-001, UC-002, UC-003, UC-015
**Impacted BR/WF:** BR-001, WF-001

## Scope

- Apply visual design from Figma export (Main.svg) to the Angular landing page
- Extract and optimize embedded images as static assets
- Extract brand logo as SVG
- Implement new color palette, typography, and layout
- Add hover animations and entrance transitions
- Update site footer to dark theme with watermark
- Maintain all existing data-driven content (hero, pain points, features, comparison, metrics, how-it-works, contact)

## Non-goals

- No backend changes
- No data model changes
- No new API endpoints
- No mobile-specific Figma variants (responsive handled via CSS breakpoints)

## Acceptance Criteria

- AC-1: Hero section displays full-width background image with gradient overlay, feature badge cards, and CTA button
- AC-2: Pain points section uses asymmetric 3-column grid with image cards mixed alongside text cards
- AC-3: Features section renders 3 cards in first row, 4 cards in second row (12-column grid)
- AC-4: Comparison section shows server-rack background with side-by-side Sysadmin vs VEZHA 360
- AC-5: Metrics section displays stat cards with terracotta accent values
- AC-6: How It Works section has dark olive background with numbered step cards
- AC-7: Contact section has background image with floating form fields
- AC-8: Footer uses dark theme (#141613) with multi-column links and VEZHA watermark
- AC-9: All content still driven from API (no hardcoded text except section labels)
- AC-10: All interactive elements (buttons, cards, inputs) have hover animations
- AC-11: Hero content has entrance fade-slide animation
- AC-12: Images optimized (total < 1 MB for all landing images)
- AC-13: Angular build succeeds without errors
- AC-14: Color palette matches Figma: #FFF9ED (bg), #F0E7D7 (cards), #5A684D (olive), #C35026 (CTA)

## Security Acceptance Criteria

- SEC-1: No user-supplied content rendered as raw HTML in landing page (all text via Angular interpolation)
- SEC-2: Image assets are static files, not user-uploadable (no path traversal risk)
- SEC-3: No new API surface or auth changes introduced

## Failure Modes / Error Mapping

| Scenario                    | Behavior                    |
|-----------------------------|-----------------------------|
| Image asset missing         | Broken image, no crash      |
| API content unavailable     | Banner error shown          |
| Logo SVG missing            | Empty logo area             |

## Test Matrix

| AC     | Unit | Integration | Curl Dev | Base UI | UI | Curl Prod API | Prod Fullstack |
|--------|------|-------------|----------|---------|----|---------------|----------------|
| AC-1   | -    | -           | -        | -       | -  | -             | -              |
| AC-2   | -    | -           | -        | -       | -  | -             | -              |
| AC-3   | -    | -           | -        | -       | -  | -             | -              |
| AC-9   | -    | -           | -        | -       | -  | -             | -              |
| AC-13  | -    | -           | -        | -       | -  | -             | -              |
| SEC-1  | -    | -           | -        | -       | -  | -             | -              |

Note: This is a visual/CSS-only change. Testing is visual inspection via screenshots against Figma baseline. Automated UI tests with Playwright baselines to be added in a subsequent SDD.

## Changes Made

### Files Modified

- `frontend/src/app/landing/landing.component.html` — Complete template rewrite for new layout
- `frontend/src/app/landing/landing.component.scss` — Complete style rewrite matching Figma design
- `frontend/src/app/site-footer/site-footer.component.html` — Dark footer with watermark
- `frontend/src/app/site-footer/site-footer.component.scss` — Dark theme styles
- `frontend/src/app/site-footer/site-footer.component.ts` — Added `currentYear` property
- `frontend/src/styles.scss` — Updated background color, added Montserrat 800 weight
- `frontend/angular.json` — Added `src/assets` to build assets configuration

### Files Created

- `frontend/src/assets/images/hero.jpg` (99 KB) — Hero background
- `frontend/src/assets/images/pain-chaos.jpg` (180 KB) — Pain points image
- `frontend/src/assets/images/pain-laptop.jpg` (132 KB) — Pain points image
- `frontend/src/assets/images/pain-typing.jpg` (80 KB) — Contact background
- `frontend/src/assets/images/server-rack.jpg` (216 KB) — Comparison background
- `frontend/src/assets/images/coder.jpg` (74 KB) — How It Works background
- `frontend/src/assets/images/logo.svg` (2 KB) — Brand mark
