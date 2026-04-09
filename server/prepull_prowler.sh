#!/bin/bash
# Pre-pull Prowler image in background to avoid delays during scan requests

PROWLER_IMAGE="${PROWLER_IMAGE:-toniblyx/prowler:latest}"

echo "[prepull] Starting background Prowler image pull: $PROWLER_IMAGE"

# Check if image already exists
if docker images -q "$PROWLER_IMAGE" | grep -q .; then
    echo "[prepull] Prowler image already exists locally, skipping pull"
    exit 0
fi

# Clean up Docker system first to avoid layer corruption issues
echo "[prepull] Cleaning up Docker system before pull..."
docker system prune -f > /dev/null 2>&1 || true

# Pull image in background (non-blocking) with retry logic
(
    for attempt in 1 2; do
        echo "[prepull] Pull attempt $attempt/2..."
        if docker pull "$PROWLER_IMAGE" >> /tmp/prowler_pull.log 2>&1; then
            echo "[prepull] Successfully pulled Prowler image"
            exit 0
        else
            if [ $attempt -lt 2 ]; then
                echo "[prepull] Pull failed, cleaning up and retrying..."
                docker system prune -f > /dev/null 2>&1 || true
                sleep 5
            else
                echo "[prepull] Failed to pull image after 2 attempts. Check /tmp/prowler_pull.log"
                exit 1
            fi
        fi
    done
) &
PULL_PID=$!

echo "[prepull] Prowler image pull started in background (PID: $PULL_PID)"
echo "[prepull] This may take several minutes. The image will be available when ready."
echo "[prepull] Check /tmp/prowler_pull.log for pull progress"

# Don't wait for completion - let it run in background
exit 0

