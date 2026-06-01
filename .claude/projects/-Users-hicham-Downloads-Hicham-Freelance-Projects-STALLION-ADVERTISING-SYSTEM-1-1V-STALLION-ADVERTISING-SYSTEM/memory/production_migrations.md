---
name: production-migrations
description: SQL commands that must be run manually in production Postgres — tracks schema changes not yet applied via prisma migrate deploy
metadata:
  type: project
---

## Applied in production (already done or pending confirmation)

### 2026-06-01 — metaTokenExpiresAt on client_kpi_configs
```sql
ALTER TABLE "client_kpi_configs" ADD COLUMN IF NOT EXISTS "metaTokenExpiresAt" TIMESTAMP(3);
```
**Why:** Column was added to Prisma schema without a migration. Backend PUT /kpi-config crashed with "column does not exist".

### 2026-06-01 — currency on client_costs
```sql
ALTER TABLE "client_costs" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MAD';
```
**Why:** Added to support per-cost currency selection (MAD/USD/EUR) in admin and client portal costs pages.

## After running any SQL above

Always regenerate the Prisma client on the server:
```bash
cd backend && npx prisma generate
```

**How to apply:** Connect to production Postgres and run the SQL directly, or use `npx prisma migrate deploy` if the migration file exists in `backend/prisma/migrations/`.
