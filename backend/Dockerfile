# ---- Base ----
FROM node:lts-alpine AS base
RUN corepack enable

WORKDIR /app

# Copy workspace root files needed for dependency resolution
COPY package.json yarn.lock .yarnrc.yml ./

# Copy only the backend workspace package.json for layer caching
COPY backend/package.json backend/package.json

# ---- Dependencies ----
FROM base AS deps

# Install production + dev dependencies (dev needed for build step)
RUN yarn workspaces focus backend

# ---- Build ----
FROM deps AS build

# Copy backend source
COPY backend/ backend/

WORKDIR /app/backend

# Generate Prisma client and build
RUN npx prisma generate && npx nest build

# ---- Production ----
FROM node:lts-alpine AS production

RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY backend/package.json backend/package.json

RUN yarn workspaces focus backend --production

WORKDIR /app/backend

# Copy built output and generated Prisma client
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/generated ./src/generated

# Copy Prisma schema and migrations for running migrations at startup
COPY --from=build /app/backend/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
