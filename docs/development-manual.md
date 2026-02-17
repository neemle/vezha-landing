# VEZHA 360 Landing — Development Manual

**Version:** 1.0.0

---

## 1. Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Node.js 22+ (for local frontend dev only)
- Git

---

## 2. Project Structure

```
vezha-landing/
  backend/               # NestJS 11 API
    src/
      admin/             # Admin module (guard, controller)
      content/           # Landing content CRUD + translation
      lead/              # Lead capture + export
      pages/             # Static pages + categories
      app.module.ts      # Root module (TypeORM, Swagger, static files)
      main.ts            # Bootstrap + Swagger setup
    package.json
  frontend/              # Angular 20 SPA
    src/
      app/
        landing/         # Main landing page component
        admin/           # Admin panel component
        site-footer/     # Dynamic footer component
        static-page/     # Public static page component
        models/          # TypeScript interfaces
        services/        # HTTP services (content, lead, pages, seo)
      assets/images/     # Landing images (hero, pain, comparison, etc.)
      styles.scss        # Global styles
    angular.json
    package.json
  docs/                  # All documentation
  docker-compose.yml     # One-command dev mode
  Dockerfile             # Multi-stage build
```

---

## 3. One-Command Dev Mode

```bash
docker compose up --build
```

This builds and starts the full stack:

- **App:** http://localhost:3010
- **API:** http://localhost:3010/api
- **Swagger:** http://localhost:3010/api/docs
- **Admin:** http://localhost:3010/admin (token: `vezha-admin`)

SQLite database persists in `./db/vezha.sqlite`.

---

## 4. Local Frontend Development

```bash
cd frontend
npm install
npm start
```

Frontend dev server runs at http://localhost:4200. API calls proxy to the Docker backend at port 3010.

---

## 5. Local Backend Development

```bash
cd backend
npm install
npm run start:dev
```

Backend runs at http://localhost:3000 with hot-reload. Swagger at http://localhost:3000/api/docs.

---

## 6. Build Commands

| Command                  | Location   | Purpose                        |
|--------------------------|------------|--------------------------------|
| `npm run build`          | frontend/  | Production Angular build       |
| `npm run build`          | backend/   | Production NestJS build        |
| `docker compose up --build` | root    | Full stack Docker build        |

---

## 7. Code Conventions

- **Frontend:** Angular 20 standalone components, signals-based reactivity, SCSS scoped styles
- **Backend:** NestJS modules, class-validator DTOs, TypeORM entities
- **Type safety:** No `any`, no unsafe casts
- **Max line length:** 120 characters
- **Max function:** 30 non-empty lines
- **Max class:** 500 non-empty lines

---

## 8. Database

SQLite3 with TypeORM auto-synchronize. Schema managed by entity definitions.

Reset database:

```bash
rm -f db/vezha.sqlite
docker compose restart
```

---

## 9. Adding a New Locale

1. Start the app
2. Go to http://localhost:3010/admin
3. Enter admin token
4. Setup > Main Page > enter locale code (e.g., `pl`)
5. Click create — auto-translates from EN via LibreTranslate
6. Review and edit translated content
7. Toggle active to publish

---

## 10. Environment Variables

See `docs/configuration-manual.md` for full list.
