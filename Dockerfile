# syntax=docker/dockerfile:1

# ---------------------------------------------------------
# Stage 1: Base
# ---------------------------------------------------------
FROM node:18-alpine AS base
# Install libc6-compat for Prisma engines and Next.js SWC binaries
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------
FROM base AS deps
# Copy package manifests
COPY package.json package-lock.json* ./
# Copy Prisma directory to generate the client
COPY prisma ./prisma

# Install dependencies strictly from the lockfile
RUN npm ci

# Generate the Prisma Client
RUN npx prisma generate

# ---------------------------------------------------------
# Stage 3: Builder
# ---------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# ---------------------------------------------------------
# Stage 4: Runner
# ---------------------------------------------------------
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets
COPY --from=builder /app/public ./public

# Copy the standalone build and static files
# The standalone build automatically traces and includes the Prisma Client
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optional: If you need to run Prisma migrations inside the container before starting
# COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application using the standalone server
CMD ["node", "server.js"]