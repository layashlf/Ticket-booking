#!/bin/bash
set -e

# Load environment variables
APP_ENV_FILE="./.env"
if [[ ! -f "${APP_ENV_FILE}" ]]; then
  echo "Error: .env file not found at ${APP_ENV_FILE}"
  exit 1
fi

COMPOSE_CMD="docker compose --env-file $APP_ENV_FILE"

if [[ "$1" == "stop" ]]; then
  echo "Stopping and cleaning up..."
  $COMPOSE_CMD down
else
  echo "Starting the system..."
  # Use --build to ensure any package changes are captured
  $COMPOSE_CMD up --build
fi