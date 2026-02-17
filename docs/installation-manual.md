# VEZHA 360 Landing — Installation Manual

**Version:** 1.0.0

---

## 1. Requirements

- Docker Engine 24+ with Compose V2
- 512 MB RAM minimum
- 1 GB disk space

---

## 2. Quick Start (Docker)

```bash
git clone <repo-url> vezha-landing
cd vezha-landing
docker compose up --build -d
```

App available at http://localhost:3010.

---

## 3. Environment Configuration

Create or edit environment variables in `docker-compose.yml` or via `.env` file:

| Variable            | Default           | Description                   |
|---------------------|-------------------|-------------------------------|
| PORT                | 3000              | Internal HTTP listen port     |
| DB_PATH             | /db/vezha.sqlite  | SQLite database file path     |
| ADMIN_TOKEN         | vezha-admin       | Admin panel auth token        |
| LIBRETRANSLATE_URL  | (empty)           | LibreTranslate API endpoint   |
| LIBRETRANSLATE_API_KEY | (empty)        | LibreTranslate API key        |

---

## 4. Data Persistence

SQLite database stored in `./db/` volume mount. To reset:

```bash
docker compose down
rm -f db/vezha.sqlite
docker compose up -d
```

---

## 5. Reverse Proxy Setup

The app is designed to work behind a reverse proxy (nginx, Traefik, cloud LB).

### Required Proxy Headers

```
X-Forwarded-For: <client-ip>
X-Forwarded-Proto: <http|https>
X-Forwarded-Host: <external-hostname>
```

### Example nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name vezha360.example.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Example Traefik Labels

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.vezha.rule=Host(`vezha360.example.com`)"
  - "traefik.http.routers.vezha.tls=true"
  - "traefik.http.services.vezha.loadbalancer.server.port=3000"
```

---

## 6. Health Check

The app exposes a health endpoint:

```
GET /api/health
Response: { "ok": true, "status": "ok" }
```

Use this for Docker healthcheck or load balancer probes.

---

## 7. Admin Access

1. Navigate to `https://your-domain/admin`
2. Enter the `ADMIN_TOKEN` value
3. Access content management, lead export, and page management

---

## 8. Backup

Backup the SQLite database file:

```bash
cp db/vezha.sqlite db/vezha.sqlite.bak
```

Restore:

```bash
cp db/vezha.sqlite.bak db/vezha.sqlite
docker compose restart
```

---

## 9. Updating

```bash
git pull
docker compose up --build -d
```

Database schema auto-migrates via TypeORM synchronize.

---

## 10. Troubleshooting

| Issue                | Solution                                    |
|----------------------|---------------------------------------------|
| Port 3010 in use     | Change port mapping in docker-compose.yml   |
| DB locked            | Stop app, check for stale processes         |
| Translation fails    | Verify LIBRETRANSLATE_URL is reachable      |
| 401 on admin         | Check ADMIN_TOKEN env var matches input     |
| Blank landing page   | Seed content via admin panel first          |
