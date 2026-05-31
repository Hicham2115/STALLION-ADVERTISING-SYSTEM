# Product Requirements Document
# Stallion Advertising — Agency Management System v1.1

**Document version:** 1.1  
**Date:** 2026-05-26  
**Status:** Shipped / Active Development

---

## 1. Product Overview

Stallion Advertising System is a full-stack, multi-tenant SaaS platform purpose-built for advertising agencies. It centralises client management, financial tracking, team operations, e-commerce CRM, and client-facing communication into a single workspace. The system ships a separate, branded client portal that gives each client a real-time window into their campaigns, invoices, content approvals, and meeting bookings.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Eliminate spreadsheet dependency for financials | 100% of revenue & expense records logged in-system |
| Reduce lead response time | Lead-to-first-activity time < 24 h |
| Improve client transparency | Client portal monthly active sessions ≥ 80% of active clients |
| Track team accountability | % of tasks completed on or before due date |
| Automate closer commission tracking | Commission error rate = 0 (manual calculation eliminated) |

---

## 3. Users & Roles

| Role | Access Level | Primary Use Case |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Cross-agency master dashboard | Platform owner monitoring all agencies |
| **ADMIN** | Full agency access | CEO / agency owner |
| **MANAGER** | Clients, revenue, expenses, leads, CRM, portal admin | Operations manager |
| **TEAM_MEMBER** | Tasks, chat, meetings, my orders | Designer, copywriter, closer |
| **Client Portal User** | Read-only portal scoped to their account | End-client |

Route-level enforcement: `AdminRoute`, `ManagerRoute`, and `PortalRoute` guards are applied at the React router level and validated on every API request via JWT middleware.

---

## 4. System Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 14+ via Prisma ORM |
| Realtime | Socket.IO (WebSocket) |
| Auth | JWT RS256 + optional Clerk SSO |
| Internationalisation | i18next — English, French, Arabic (RTL) |
| Multi-currency | MAD / USD / EUR with live exchange rates |
| Export | xlsx (revenue & expenses) |
| Deployment | Frontend → Vercel · Backend + DB → Railway / Supabase |

---

## 5. Modules & Features

### 5.1 CEO Dashboard

**Route:** `/`  
**Access:** All authenticated users (scoped by role)

- KPI cards: active clients, MRR, monthly revenue, monthly expenses, monthly profit, profit margin, retention rate, ROAS, cashflow forecast, pending invoices count + amount, team productivity score, open leads, pending tasks, overdue payments, conversion rate
- Revenue vs. expenses vs. profit bar chart (12-month)
- Top clients ranking by revenue
- Activity feed (latest actions across modules)
- Revenue growth % vs. prior month

---

### 5.2 Client Management

**Route:** `/clients`, `/clients/:id`  
**Access:** MANAGER and above

**Client record fields:** name, services (multi-select from company catalogue), monthly fee, billing frequency (monthly / quarterly / annually), status (ACTIVE / PAUSED / CANCELLED / PENDING / ONE_TIME), start date, website, Google Drive link, contact person, email, phone, country, preferred currency, internal notes.

**Features:**
- Full CRUD (create, read, update, soft-delete via archive)
- Archive / restore with confirmation
- Client detail page with: payment history, task history, associated costs, activity log
- Per-client cost entries (ad spend passthrough, etc.)
- Per-client preferred currency stored and honoured in portal views

---

### 5.3 Revenue Tracker

**Route:** `/revenue`  
**Access:** MANAGER and above

- Log payments: amount, date, payment method (bank transfer / credit card / cash / cheque / PayPal / other), invoice number, status (PAID / PENDING / OVERDUE), PDF attachment, notes
- Monthly bar chart of collected revenue
- By-service revenue pie chart
- Summary cards: total collected, pending, overdue
- Filter by client, month, payment method, status
- Excel export of full payment ledger

---

### 5.4 Expenses Tracker

**Route:** `/expenses`  
**Access:** MANAGER and above

- Log expenses with: name, category (rent / salaries / software subscriptions / insurance / ads spend / freelancers / equipment / travel / misc), type (FIXED / VARIABLE), amount, date, payment method, payment status (PAID / PENDING), recurring flag, notes
- Monthly trend chart
- Category breakdown pie chart
- Fixed vs. variable split summary
- Filter by month, category, type, payment status
- Excel export

---

### 5.5 Leads CRM

**Route:** `/leads`  
**Access:** MANAGER and above

- Kanban board with columns: NEW → WARMED → CLOSED WON → CLOSED LOST
- List view with sortable columns
- Lead record: name, company, email, phone, service of interest, expected value, source (referral / website / social media / cold outreach / event), assigned team member, follow-up date, notes
- Lead activity timeline (add unlimited timestamped notes per lead)
- Stale lead alerts (configurable inactivity threshold)
- Pipeline stats: conversion rate, total expected value, leads by stage

---

### 5.6 Tasks Tracker

**Route:** `/tasks`  
**Access:** All authenticated users (team members see their own tasks)

- Kanban board: TODO → IN PROGRESS → REVIEW → COMPLETED
- List view with filters
- Task record: title, description, assigned user, linked client, priority (LOW / MEDIUM / HIGH / URGENT), due date, status, tags
- Overdue alerts
- Team workload view (admin)
- My Tasks: team members see only their assigned tasks

---

### 5.7 E-commerce CRM

**Route:** `/crm`  
**Access:** MANAGER and above; closers access via `/my-orders`

#### Orders

- Full order lifecycle: NEW → PENDING_CONFIRMATION → CONFIRMED → NO_ANSWER → CANCELLED / REFUSED → SHIPPED → DELIVERED / RETURNED
- Payment status: COD_PENDING / PAID / REFUNDED
- Order fields: customer name/phone/city, product, quantity, order amount, product cost, shipping cost, ad cost, closer commission (auto-calculated), net profit (auto-calculated)
- Source attribution: Facebook Ads, TikTok Ads, Google Ads, organic, WhatsApp, Instagram, other
- Closer assignment per order
- Shopify integration: pull orders directly from connected Shopify stores

#### Customers

- Auto-created from orders or manual entry
- Customer profile: name, phone, city, address, notes, total spend, order count

#### Closers

- Mark any team member as a closer (`isCloser` flag)
- Assign closers to specific clients
- Commission rules per client + closer: fixed per order or percentage of order amount
- Auto-generated commission records on order confirmation
- Closer stats dashboard: total orders, confirmed, shipped, delivered, conversion rate, total commission earned, commission paid vs. unpaid

#### Shopify

- Connect one or more Shopify stores per client (store URL + access token)
- Sync orders into the CRM; `lastSyncAt` tracked per config
- Shopify-sourced orders tagged with `shopifyOrderId` and `shopifyStore`

---

### 5.8 Team Chat

**Route:** `/chat`, `/chat/:type/:id`  
**Access:** All authenticated users

- Public and private channels (team creates and manages)
- Direct messages between any two team members
- Real-time delivery via Socket.IO
- Message types: text, file, image, system
- Emoji reactions (multiple per message)
- Reply threading (quote a specific message)
- Edit and soft-delete messages
- Online / last-seen status per user

---

### 5.9 Meetings

**Route:** `/meetings`  
**Access:** All authenticated users; clients can book via portal

- Meeting types: name, duration, description, color (admin-configurable)
- Admin availability: day-of-week + start/end time + timezone per admin
- Blocked dates with optional reason
- Meeting record: title, description, meeting link, status (SCHEDULED / CONFIRMED / COMPLETED / CANCELLED / RESCHEDULED), start/end time, timezone, public notes, internal notes, cancel reason
- Client portal booking: clients pick a meeting type, select an available slot, and submit; recorded under `bookedByPortalUserId`

---

### 5.10 Client Portal

**Route:** `/portal/*` (separate auth session)  
**Access:** ClientPortalUser (one per client account)

The portal is the client-facing product skin. Each client logs in with a dedicated credential and sees only their own data.

| Sub-route | What the client sees |
|-----------|---------------------|
| `/portal` | Dashboard: summary, recent payments, pending invoices, unread notifications, pending approvals |
| `/portal/analytics` | Meta Ads KPIs (spend, reach, impressions, CPM, CPC, CTR, leads, purchases, ROAS, cost-per-lead, conversion rate) via Meta token integration |
| `/portal/costs` | Their dedicated cost entries (ad spend, etc.) |
| `/portal/content` | Content deliveries awaiting approval or revision; client can approve, request revisions, leave comments |
| `/portal/updates` | Project updates posted by the agency with phase tags, images, files; client can comment |
| `/portal/invoices` | Payment records (paid, pending, overdue) with PDF download |
| `/portal/orders` | Their CRM orders view (ClientCrm) |
| `/portal/meetings` | Book a meeting from admin availability slots |
| `/portal/profile` | Update name, avatar, password |

**Portal admin management** (agency side):  
**Route:** `/portal-admin`, `/portal-admin/:clientId`  
**Access:** MANAGER and above  
- Create/reset client portal credentials
- View last login, enable/disable portal user
- Manage project updates, content deliveries, KPI config (Meta token + ad account ID) per client

---

### 5.11 Team Management

**Route:** `/team`  
**Access:** ADMIN only

- Invite / create team members with role assignment
- Suspend / reactivate accounts
- Mark users as closers
- View last login

---

### 5.12 Settings — Services Catalogue

**Route:** `/settings/services`  
**Access:** ADMIN only

- Define the agency's service offering (SEO, social media management, paid ads, etc.)
- Each service has a name, slug, description, active toggle, sort order
- Services populate the multi-select used on Client records

---

### 5.13 Master Dashboard

**Route:** `/master`  
**Access:** SUPER_ADMIN only

Cross-agency visibility for platform owners. Aggregates key metrics across all registered agencies.

---

### 5.14 Profile

**Route:** `/profile`  
**Access:** All authenticated users

- Update name, phone, avatar
- Change password
- Clerk SSO profile view (when Clerk is enabled)

---

## 6. Authentication & Security

- **JWT (RS256):** All API requests validated via `Authorization: Bearer <token>`; tokens expire per `JWT_EXPIRES_IN` env var (default 7 days)
- **Clerk SSO (optional):** Social / enterprise login; `clerkId` stored per user; SSO callback route `/sso-callback`
- **Portal auth:** Separate JWT issued at `/portal/login`; portal middleware (`portalAuth.ts`) prevents cross-contamination with agency session
- **Role enforcement:** Every protected route checks `user.role` server-side; frontend guards are UI-only
- **Password reset:** Token + expiry stored on user record
- **Suspension:** `suspended` flag blocks login without deleting the account

---

## 7. Multi-Currency & Localisation

- Supported currencies: MAD (default), USD, EUR
- Exchange rates stored in `ExchangeRate` table and used across revenue/expense views
- Per-client `preferredCurrency` controls portal invoice display
- i18next translations ship for English (`en`), French (`fr`), and Arabic (`ar`) with full RTL layout support
- Dark / light mode with system preference detection

---

## 8. Data Model Highlights

| Entity | Key relationships |
|--------|------------------|
| Agency | Parent of users, clients, leads, tasks, expenses, channels, meeting types, services |
| Client | Has payments, tasks, portal user, project updates, content, KPI config, meetings, CRM orders, closers, costs |
| User | Can be assigned tasks & leads; can be a closer; has chat presence; has availability for meetings |
| CrmOrder | Belongs to client + optional closer; generates `CloserCommissionRecord` on confirmation |
| ClientPortalUser | 1-to-1 with Client; has notifications |
| Meeting | Links a client, an admin, and a meeting type; portal booking tracked via `bookedByPortalUserId` |

---

## 9. API Surface

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /login`, `GET /me`, `PUT /profile`, `PUT /change-password` |
| Clients | CRUD + archive/restore |
| Payments | CRUD + summary + by-service + Excel export |
| Expenses | CRUD + summary + Excel export |
| Leads | CRUD + stats + activities |
| Tasks | CRUD + workload |
| CRM | Orders, customers, Shopify config, commission rules, closer stats |
| Chat | Channels, DMs, messages (REST + Socket.IO) |
| Meetings | CRUD + availability + blocked dates + meeting types |
| Portal | Dashboard, updates, content, invoices, KPIs, meetings, orders, profile |
| Portal Admin | Manage portal users, updates, content, KPI config per client |
| Dashboard | Stats, revenue chart, top clients |
| Currency | Exchange rates |
| Users | Team CRUD |
| Services | Company service catalogue |
| Master | Cross-agency aggregates |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | < 300 ms for all list endpoints (p95) |
| Concurrent users | Designed for team sizes of 2–50 per agency |
| Export | Excel files generated server-side and streamed; max 10,000 rows |
| Realtime latency | Chat message delivery < 200 ms on LAN |
| Uptime | 99.5% monthly (Railway/Vercel SLA-dependent) |
| Data isolation | Every query scoped by `agencyId`; no cross-agency data leaks |
| Mobile | Responsive layout (Tailwind); no native app |

---

## 11. Deployment Topology

```
[Client Browser]
      │
      ▼
[Vercel — React SPA]
      │  HTTPS
      ▼
[Railway — Express API + Socket.IO]
      │  Prisma / TCP
      ▼
[Railway PostgreSQL  ──or──  Supabase PostgreSQL]
```

Environment variables required per tier:

**Backend:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `FRONTEND_URL`, `CLERK_SECRET_KEY` (optional)  
**Frontend:** `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY` (optional)

---

## 12. Out of Scope (v1.1)

- Native mobile app
- SMS / WhatsApp notifications
- Automated invoice PDF generation (currently manual PDF URL field)
- Two-factor authentication
- Stripe or payment-gateway integration
- AI-assisted reporting or forecasting
- White-label multi-tenant self-service signup
