FROM node:20-bullseye

# 1. Install system dependencies for Prisma/Healthchecks
RUN apt-get update && apt-get install -y openssl libssl-dev curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install dependencies
COPY package*.json ./
RUN npm ci

# 3. Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# 4. Copy the rest of the source code
COPY . .

EXPOSE 3001
