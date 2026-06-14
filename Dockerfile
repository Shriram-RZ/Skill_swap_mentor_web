# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/
RUN npm ci

# ── builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── runner stage ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./entrypoint.sh
# Strip any CR (Windows CRLF) so the shebang isn't read as "/bin/sh\r", then make executable.
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
