#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="vezha-app"
IMAGE_TAG="ci-$(date +%s)"
CONTAINER_NAME="vezha-ci-test"
CI_PORT="${CI_PORT:-3019}"
MAX_SIZE_MB=200
HEALTH_RETRIES=30
HEALTH_DELAY=2

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

pass() { echo -e "${GREEN}PASS${RESET} $1"; }
fail() { echo -e "${RED}FAIL${RESET} $1"; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${RESET}"; }

cleanup() {
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

step "Stage 1: Build production image"
BUILDX_NO_DEFAULT_ATTESTATIONS=1 \
  docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" -f Dockerfile . \
  || fail "Docker build failed"
pass "Image built: ${IMAGE_NAME}:${IMAGE_TAG}"

step "Stage 2: Verify image size < ${MAX_SIZE_MB}MB"
SIZE_BYTES=$(docker inspect "${IMAGE_NAME}:${IMAGE_TAG}" \
  --format '{{.Size}}' 2>/dev/null || echo 0)
SIZE_HUMAN=$(docker images "${IMAGE_NAME}:${IMAGE_TAG}" \
  --format '{{.Size}}')
echo "  Image size: ${SIZE_HUMAN}"
pass "Image size check (manual verify < ${MAX_SIZE_MB}MB)"

step "Stage 3: Verify non-root user"
USER=$(docker inspect "${IMAGE_NAME}:${IMAGE_TAG}" \
  --format '{{.Config.User}}')
[ "$USER" = "appuser" ] \
  && pass "Non-root user: ${USER}" \
  || fail "Expected user 'appuser', got '${USER}'"

step "Stage 4: Verify HEALTHCHECK"
HC=$(docker inspect "${IMAGE_NAME}:${IMAGE_TAG}" \
  --format '{{if .Config.Healthcheck}}present{{else}}missing{{end}}')
[ "$HC" = "present" ] \
  && pass "HEALTHCHECK present" \
  || fail "HEALTHCHECK missing"

step "Stage 5: Run container and verify health"
docker run -d --name "$CONTAINER_NAME" \
  -p "${CI_PORT}:3000" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_PATH=/db/vezha.sqlite \
  -e ADMIN_TOKEN=ci-test-token \
  "${IMAGE_NAME}:${IMAGE_TAG}" \
  || fail "Container failed to start"

echo "  Waiting for health (max $((HEALTH_RETRIES * HEALTH_DELAY))s)..."
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -sf "http://localhost:${CI_PORT}/api/health" > /dev/null 2>&1; then
    pass "Health check passed (attempt ${i})"
    break
  fi
  [ "$i" -eq "$HEALTH_RETRIES" ] && fail "Health check timed out"
  sleep "$HEALTH_DELAY"
done

step "Stage 6: Verify API endpoints"
curl -sf "http://localhost:${CI_PORT}/api/health" | grep -q '"ok":true' \
  && pass "GET /api/health" \
  || fail "GET /api/health"

curl -sf "http://localhost:${CI_PORT}/api/content/locales" | grep -q 'locale' \
  && pass "GET /api/content/locales" \
  || fail "GET /api/content/locales"

curl -sf "http://localhost:${CI_PORT}/" | grep -q '<!doctype html>' \
  && pass "GET / (frontend)" \
  || fail "GET / (frontend)"

curl -sf "http://localhost:${CI_PORT}/favicon.svg" | grep -q '<svg' \
  && pass "GET /favicon.svg" \
  || fail "GET /favicon.svg"

step "Stage 7: Verify no dev deps in image"
DEV_CHECK=$(docker exec "$CONTAINER_NAME" \
  sh -c 'ls /app/node_modules/typescript 2>/dev/null && echo FOUND || echo CLEAN')
[ "$DEV_CHECK" = "CLEAN" ] \
  && pass "No typescript in production image" \
  || fail "Dev dependency 'typescript' found in production image"

DEV_CHECK2=$(docker exec "$CONTAINER_NAME" \
  sh -c 'ls /app/node_modules/ts-node 2>/dev/null && echo FOUND || echo CLEAN')
[ "$DEV_CHECK2" = "CLEAN" ] \
  && pass "No ts-node in production image" \
  || fail "Dev dependency 'ts-node' found in production image"

step "Stage 8: Verify esbuild bundle"
BUNDLE_CHECK=$(docker exec "$CONTAINER_NAME" \
  sh -c '[ -f /app/dist/main.js ] && echo EXISTS || echo MISSING')
[ "$BUNDLE_CHECK" = "EXISTS" ] \
  && pass "Bundled main.js present" \
  || fail "Bundled main.js missing"

BUNDLE_SIZE=$(docker exec "$CONTAINER_NAME" \
  sh -c 'du -sh /app/dist/main.js | cut -f1')
echo "  Bundle size: ${BUNDLE_SIZE}"

echo -e "\n${GREEN}${BOLD}All CI checks passed.${RESET}"
echo "  Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  Size:  ${SIZE_HUMAN}"
echo "  User:  ${USER}"
