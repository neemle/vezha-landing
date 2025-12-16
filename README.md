## Vezha Landing

Landing page frontend (Angular) with a NestJS API for content management and lead capture. SQLite is used for storage and everything is bundled into a single Node container for production.

### Run with Docker
- Build and start: `docker compose up --build`
- App: http://localhost:3000 (serves the Angular bundle)
- API: http://localhost:3000/api

### Admin area
- All admin endpoints live under `/api/admin/*`.
- Authentication: send the `x-admin-token` header. The token is `ADMIN_TOKEN` from the environment (defaults to `vezha-admin` in `docker-compose.yml`).
- Easiest way: open Swagger UI at http://localhost:3000/api/docs, click **Authorize**, set `x-admin-token`, then use the `Admin` group to manage content, leads, and CSV export.

### Developing locally (without Docker)
- `cd backend && npm install` and `cd frontend && npm install`
- Start backend: `cd backend && npm run start:dev`
- Start frontend: `cd frontend && npm run start`
- Backend expects SQLite at `backend/vezha.sqlite` (auto-created) unless `DB_PATH` is set.
