#!/usr/bin/env bash
set -euo pipefail

IMAGE="neemle/vezha-landing:latest"

echo "Building ${IMAGE} for linux/amd64..."
BUILDX_NO_DEFAULT_ATTESTATIONS=1 \
  docker build --platform linux/amd64 -t "$IMAGE" -f Dockerfile .

echo "Pushing ${IMAGE}..."
docker push "$IMAGE"

echo "Done: ${IMAGE}"
