# VEZHA 360 Landing — Configuration Manual

**Version:** 1.0.0

---

## 1. Environment Variables

### Backend

| Variable               | Type   | Default           | Description                                  |
|------------------------|--------|-------------------|----------------------------------------------|
| `NODE_ENV`             | string | production        | Runtime environment (development/production) |
| `PORT`                 | number | 3000              | HTTP listen port                             |
| `DB_PATH`              | string | /db/vezha.sqlite  | SQLite database file path                    |
| `ADMIN_TOKEN`          | string | vezha-admin       | Token for admin API authentication           |
| `LIBRETRANSLATE_URL`   | string | (empty)           | LibreTranslate API endpoint URL              |
| `LIBRETRANSLATE_API_KEY` | string | (empty)         | LibreTranslate API key (if required)         |

### Frontend

Frontend has no build-time environment variables. All configuration is derived from the API at runtime (`/api` relative path).

---

## 2. Docker Compose Configuration

```yaml
services:
  vezha-app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_PATH: /db/vezha.sqlite
      ADMIN_TOKEN: ${ADMIN_TOKEN:-vezha-admin}
    volumes:
      - ./db:/db
    ports:
      - "${APP_PORT:-3010}:3000"
```

---

## 3. Port Configuration

| Service  | Internal Port | Default External | Env Var    |
|----------|---------------|------------------|------------|
| App      | 3000          | 3010             | APP_PORT   |

To change the external port:

```bash
APP_PORT=8080 docker compose up -d
```

---

## 4. Database Configuration

SQLite database path configured via `DB_PATH`. Default mounts to `./db/` on the host.

- **Reset:** Delete `db/vezha.sqlite` and restart
- **Backup:** Copy `db/vezha.sqlite` to backup location
- **Location inside container:** `/db/vezha.sqlite`

---

## 5. LibreTranslate Integration

Auto-translation for new locales requires a running LibreTranslate instance.

```yaml
environment:
  LIBRETRANSLATE_URL: http://libretranslate:5000/translate
  LIBRETRANSLATE_API_KEY: your-api-key
```

If not configured, the "Create locale" feature returns a 502 error.

---

## 6. CORS Configuration

CORS is enabled globally with `origin: true` (all origins allowed). For production, restrict via reverse proxy.

---

## 7. Swagger API Documentation

Available at `/api/docs` when the app is running. Provides interactive API exploration with auth header support.

---

## 8. Static Assets

Landing page images stored in `frontend/src/assets/images/`:

| File              | Usage                          | Size  |
|-------------------|--------------------------------|-------|
| hero.jpg          | Hero section background        | 99 KB |
| pain-chaos.jpg    | Pain points image card         | 180 KB|
| pain-laptop.jpg   | Pain points image card         | 132 KB|
| pain-typing.jpg   | Contact section background     | 80 KB |
| server-rack.jpg   | Comparison section background  | 216 KB|
| coder.jpg         | How It Works section bg        | 74 KB |
| logo.svg          | Brand mark (VEZHA)             | 2 KB  |

---

## 9. Color Palette

| Token        | Hex       | Usage                      |
|--------------|-----------|----------------------------|
| Cream        | #FFF9ED   | Page background            |
| Beige        | #F0E7D7   | Card backgrounds           |
| Olive        | #5A684D   | Primary accent, icons      |
| Olive Dark   | #3F5940   | How It Works section bg    |
| Terracotta   | #C35026   | CTA buttons, stat values   |
| Brown Text   | #353330   | Primary text               |
| Brown Muted  | #917B61   | Secondary text, labels     |
| Dark         | #141613   | Footer background          |

---

## 10. Typography

| Font        | Weights     | Usage           |
|-------------|-------------|-----------------|
| Montserrat  | 400-800     | Primary font    |
| Ubuntu      | 400-700     | Fallback font   |

Loaded via Google Fonts CDN.

---

## 11. Device Matrix

Mandatory Playwright test projects (when UI tests are implemented):

**Desktop:**
- 1920x1080 (Full HD)
- 1512x900 (Design reference)

**Tablet Portrait:**
- iPad Pro 12.9" (1024x1366)
- iPad Air (820x1180)

**Tablet Landscape:**
- iPad Pro 12.9" (1366x1024)
- iPad Air (1180x820)

**Mobile Portrait + Landscape:**
- iPhone 16 Pro Max (440x956)
- iPhone 16 Pro (402x874)
- iPhone 16 (393x852)
- iPhone 15 Pro Max (430x932)
- iPhone 15 Pro (393x852)
- iPhone 15 (393x852)
- Pixel 9 Pro XL (412x932)
- Pixel 9 Pro (412x900)
- Pixel 9 (412x892)
- Pixel 8 Pro (412x892)
- Pixel 8 (412x892)
- Pixel 7 Pro (412x892)
- Samsung Galaxy S25 Ultra (412x915)
- Samsung Galaxy S25+ (412x915)
- Samsung Galaxy S25 (412x915)
- Samsung Galaxy S24 Ultra (412x915)
- Samsung Galaxy S24+ (412x915)
- Samsung Galaxy S24 (412x915)
- Samsung Galaxy S23 Ultra (412x915)
- Samsung Galaxy S23+ (412x915)
- Samsung Galaxy S23 (412x915)
