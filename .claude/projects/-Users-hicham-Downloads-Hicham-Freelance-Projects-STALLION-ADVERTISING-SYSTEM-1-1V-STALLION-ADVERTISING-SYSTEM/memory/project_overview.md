---
name: project-overview
description: Tech stack, folder layout, key conventions and patterns for the Stallion Advertising System
metadata:
  type: project
---

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS, lives in `frontend/`
- **Backend:** Node.js + Express + TypeScript + Prisma ORM (PostgreSQL), lives in `backend/`
- **Auth:** Two separate auth flows — admin auth (`AuthContext`) and client portal auth (`PortalAuthContext` / `portalApi`)
- **API clients:** `api` (admin, uses JWT from AuthContext), `portalApi` (client portal, separate token)

## Key Folders

```
frontend/src/
  pages/Admin/PortalClients/ClientPortalDetail.tsx  — admin view of each client portal
  pages/Portal/Costs.tsx                            — client-facing costs page
  pages/MyOrders/index.tsx                          — closer/agent order submission
  context/PortalCurrencyContext.tsx                 — MAD/USD/EUR conversion for portal
  locales/en.json, fr.json, ar.json                 — i18n (all 3 must be updated together)

backend/src/
  routes/portalAdmin.ts   — admin routes for managing client portals
  routes/portal.ts        — client-facing portal API routes
  routes/crm.ts           — CRM/orders routes
  lib/currency.ts         — exchange rate logic (fetch, cache, convert)
  prisma/schema.prisma    — single source of truth for DB schema
```

## Important Conventions

- Every Prisma schema change needs a manual migration file in `backend/prisma/migrations/`
- After any schema change: run `npx prisma migrate deploy` then `npx prisma generate` on the server
- All monetary amounts are stored in MAD in the DB — convert before saving when user enters in USD/EUR
- Translation keys must be added to all three locale files (en, fr, ar) every time
- `showToast(msg, false)` = error toast; `showToast(msg)` or `showToast(msg, true)` = success

**Why:** Production DB and local schema have diverged multiple times — always create explicit migration SQL files rather than relying on `prisma migrate dev`.
