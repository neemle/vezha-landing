# ── Stage 1: Build Angular frontend ──
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build -- --configuration production

# ── Stage 2: Build NestJS backend + esbuild bundle ──
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build
RUN npx esbuild dist/main.js --bundle --platform=node --target=node24 \
    --format=cjs --minify --tree-shaking=true \
    --external:sqlite3 --external:better-sqlite3 \
    --external:swagger-ui-express --external:swagger-ui-dist \
    --external:@nestjs/microservices --external:@nestjs/websockets \
    --external:@nestjs/platform-fastify --external:@fastify/static \
    --external:class-transformer/storage \
    --outfile=dist/bundle.js

# ── Stage 3: Minimal runtime deps + stripped node ──
FROM node:24-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN apk add --no-cache binutils && \
    cp /usr/local/bin/node /app/node-stripped && \
    strip /app/node-stripped && \
    npm ci --omit=dev && \
    find node_modules -maxdepth 1 -mindepth 1 -type d \
      ! -name 'sqlite3' \
      ! -name 'bindings' \
      ! -name 'file-uri-to-path' \
      ! -name 'node-addon-api' \
      ! -name '@mapbox' \
      ! -name 'napi-build-utils' \
      ! -name 'detect-libc' \
      ! -name 'semver' \
      ! -name 'swagger-ui-express' \
      ! -name 'swagger-ui-dist' \
      ! -name '.package-lock.json' \
      -exec rm -rf {} + 2>/dev/null; \
    find node_modules -name '*.map' -delete && \
    find node_modules -name 'CHANGELOG*' -delete && \
    find node_modules -name 'README*' -delete && \
    find node_modules -name 'LICENSE*' -delete && \
    rm -rf node_modules/swagger-ui-dist/swagger-ui-es-bundle* || true

# ── Stage 4: Bare Alpine runner ──
FROM alpine:3.21 AS runner

RUN apk add --no-cache libstdc++ libgcc && \
    addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -D appuser && \
    mkdir -p /app /db && \
    chown -R appuser:appgroup /app /db

COPY --from=deps /app/node-stripped /usr/local/bin/node

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=backend-builder --chown=appuser:appgroup \
     /app/backend/dist/bundle.js ./dist/main.js
COPY --from=frontend-builder --chown=appuser:appgroup \
     /app/frontend/dist/frontend ./dist/public

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const h=require('http');h.get('http://localhost:3000/api/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
