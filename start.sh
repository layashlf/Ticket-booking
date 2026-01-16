#!/bin/sh
set -e

echo "Starting backend..."
(
  cd backend
  sh start.sh &
)

echo "Starting frontend..."
(
  cd frontend
  npm install 
  npm run dev &
)

echo "Both backend and frontend are running."
wait
