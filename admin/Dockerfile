# ---- Base ----
FROM node:lts-alpine AS base
RUN corepack enable

WORKDIR /app

# Copy workspace root files needed for dependency resolution
COPY package.json yarn.lock .yarnrc.yml ./

# Copy only the admin workspace package.json for layer caching
COPY admin/package.json admin/package.json

# ---- Dependencies ----
FROM base AS deps

# Install all dependencies (dev needed for build step)
RUN yarn workspaces focus admin

# ---- Build ----
FROM deps AS build

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy admin source
COPY admin/ admin/

WORKDIR /app/admin

RUN npx next build

# ---- Production ----
FROM node:lts-alpine AS production

WORKDIR /app

# Copy standalone output (preserves monorepo path structure from outputFileTracingRoot)
COPY --from=build /app/admin/.next/standalone ./
COPY --from=build /app/admin/.next/static ./admin/.next/static
COPY --from=build /app/admin/public ./admin/public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "admin/server.js"]
