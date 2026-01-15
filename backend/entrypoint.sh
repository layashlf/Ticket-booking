#!/bin/sh
set -e

echo "Starting Backend..."

# Generate the prisma client
npx prisma generate

# Reset the database
npx prisma db push --force-reset && npx tsx ./prisma/seed.ts

# Start app with hot-reload
echo "Starting dev server..."
exec npx tsx watch src/app.ts