# ── Stage 1: Build Angular frontend (native arch, JS only) ──
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build -- --configuration production

# ── Stage 2: Build NestJS backend + esbuild bundle (native arch, JS only) ──
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build
RUN npx esbuild dist/main.js --bundle --platform=node --target=node24 \
    --format=cjs --minify --tree-shaking=true \
    --external:@nestjs/microservices --external:@nestjs/websockets \
    --external:@nestjs/platform-fastify --external:@fastify/static \
    --external:class-transformer/storage \
    --external:swagger-ui-express --external:swagger-ui-dist \
    --outfile=dist/bundle.js

# ── Stage 3: Generate SEA blob + inject ──
FROM node:24-alpine AS sea-builder
RUN apk add --no-cache binutils
WORKDIR /app
COPY backend/sea-config.json ./
COPY --from=backend-builder /app/backend/dist/bundle.js ./dist/bundle.js
COPY --from=backend-builder /app/backend/node_modules/sql.js/dist/sql-wasm.wasm \
     ./node_modules/sql.js/dist/sql-wasm.wasm
RUN node --experimental-sea-config sea-config.json
RUN cp "$(command -v node)" vezha && \
    strip vezha && \
    npx postject vezha NODE_SEA_BLOB dist/sea-prep.blob \
      --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# ── Stage 4: Alpine runner ──
FROM alpine:3.21 AS runner
RUN apk add --no-cache libstdc++ libgcc && \
    addgroup -g 65532 nonroot && \
    adduser -u 65532 -G nonroot -D nonroot && \
    mkdir -p /db && \
    chown 65532:65532 /db

WORKDIR /app
ENV NODE_ENV=production

COPY --from=sea-builder --chown=65532:65532 /app/vezha ./vezha
COPY --from=frontend-builder --chown=65532:65532 \
     /app/frontend/dist/frontend ./public

USER 65532

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "-qO-", "http://localhost:3000/api/health"]

CMD ["./vezha"]
