# Build Angular client
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build -- --configuration production

# Build NestJS API
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

# Runtime image
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only prod deps for backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# App artifacts
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist/frontend ./dist/public

EXPOSE 3000
CMD ["node", "dist/main.js"]
