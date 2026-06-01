---
name: currency-system
description: How MAD/USD/EUR conversion works — rates source, frontend contexts, conversion on save
metadata:
  type: project
---

## Rate Sources (priority order)

1. **Live API** — `open.er-api.com/v6/latest/MAD`, called by `syncRates()` in `backend/src/lib/currency.ts`
2. **Database** — `exchange_rates` table, loaded on server start via `loadRatesFromDB()`
3. **Hardcoded fallback** — May 2026 rates: 1 USD = 9.85 MAD, 1 EUR = 10.85 MAD

## Frontend Currency Contexts

- **Portal (client-facing):** `PortalCurrencyContext` — fetches live rates from `/api/portal/rates`, exposes `fmt(amount, fromCurrency)` and `convert(amount, from)`
- **Admin side:** No context — uses hardcoded `CURRENCY_RATES` object inline in each component (e.g. `ClientPortalDetail.tsx`, `MyOrders/index.tsx`)

## Storage Rule

**All monetary amounts are stored in MAD in the database.**

- `client_costs.amount` → stored in MAD, `client_costs.currency` stores what currency the user entered
- `crm_orders.orderAmount`, `productCost`, `shippingCost` → stored in MAD (convert with `toMAD()` before POST)

## Conversion Pattern

```ts
// Convert entered amount to MAD before saving
toMAD(Number(form.orderAmount), orderCurrency)

// Display stored MAD amount in user's display currency
fmt(Number(c.amount), (c.currency || "MAD") as Currency)  // portal
convertCurrency(amount, fromCurrency, displayCurrency)     // admin
```

**Why:** Keeping MAD as the base simplifies aggregations and reporting across all clients.
