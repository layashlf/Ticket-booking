#!/bin/bash
set -e

# Load environment variables
APP_ENV_FILE="./.env"
if [[ ! -f "${APP_ENV_FILE}" ]]; then
  echo "Error: .env file not found at ${APP_ENV_FILE}"
  exit 1
fi

# Set current user IDs in the environment
USER_UID=$(id -u)
USER_GID=$(id -g)
export USER_UID USER_GID

COMPOSE_CMD="docker compose --env-file $APP_ENV_FILE"

# Create the network for the services
docker network create api-network >/dev/null 2>&1 || true

if [[ "$1" == "stop" ]]; then
  echo "Stopping and cleaning up..."
  $COMPOSE_CMD down
else
  echo "Starting the system..."
  # Use --build to ensure any package changes are captured
  $COMPOSE_CMD up --build
fi