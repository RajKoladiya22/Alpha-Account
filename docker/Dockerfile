# Multi-stage Dockerfile optimized for Next.js + Node.js + Prisma on Hostinger VPS
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies
FROM base AS deps
COPY package.json tsconfig.json ./
COPY prisma ./prisma/

# Build
FROM base AS builder
COPY --from=deps /app ./
COPY src ./src

# Runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app /app
USER nextjs

EXPOSE 3000
CMD ["node", "src/server/socket-handler.ts"]
