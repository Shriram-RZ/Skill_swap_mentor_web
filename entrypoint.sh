#!/bin/sh
set -e

echo "==> Pushing database schema..."
npx prisma db push --skip-generate

echo "==> Seeding database..."
npx tsx prisma/seed.ts 2>/dev/null && echo "    Seeded." || echo "    Seed skipped (already done)."

echo "==> Starting Next.js..."
exec node_modules/.bin/next start
