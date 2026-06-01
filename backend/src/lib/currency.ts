import { prisma } from './prisma';

export type Currency = 'MAD' | 'USD' | 'EUR';

// Base rates: 1 unit of currency X = N MAD. All other rates are derived from these
// to guarantee perfect round-trip accuracy (EUR→MAD→EUR = original amount).
const TO_MAD_FALLBACK: Record<string, number> = { MAD: 1, USD: 9.85, EUR: 10.85 };

// ratesCache stores X→MAD rates (1 unit of X in MAD)
let ratesCache: Record<string, number> = { ...TO_MAD_FALLBACK };

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const fromToMAD = ratesCache[from] ?? TO_MAD_FALLBACK[from] ?? 1;
  const toToMAD   = ratesCache[to]   ?? TO_MAD_FALLBACK[to]   ?? 1;
  return amount * fromToMAD / toToMAD;
}

export async function syncRates(): Promise<void> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/MAD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { rates: Record<string, number> };
    const { rates } = data;

    const currencies: Currency[] = ['MAD', 'USD', 'EUR'];
    const newCache: Record<string, number> = { MAD: 1 };

    for (const cur of currencies) {
      if (cur === 'MAD') continue;
      // rates[cur] = "1 MAD = X cur", so "1 cur = 1/rates[cur] MAD"
      const madPerUnit = rates[cur] ? 1 / rates[cur] : TO_MAD_FALLBACK[cur];
      newCache[cur] = madPerUnit;

      try {
        await prisma.$executeRaw`
          INSERT INTO exchange_rates (id, base_currency, target_currency, rate, updated_at)
          VALUES (${`${cur}_MAD`}, ${cur}, ${'MAD'}, ${madPerUnit}, NOW())
          ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = ${madPerUnit}, updated_at = NOW()
        `;
      } catch {
        // DB write failure is non-fatal
      }
    }

    ratesCache = newCache;
    console.log('[currency] Exchange rates synced from API');
  } catch (err) {
    console.warn('[currency] Rate sync failed, using cached/fallback rates:', (err as Error).message);
  }
}

export async function loadRatesFromDB(): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<{ base_currency: string; target_currency: string; rate: number }[]>`
      SELECT base_currency, target_currency, rate FROM exchange_rates
    `;
    if (!rows.length) return;
    const cache: Record<string, number> = { MAD: 1 };
    for (const r of rows) {
      // Only store X→MAD rates
      if (r.target_currency === 'MAD') cache[r.base_currency] = Number(r.rate);
    }
    ratesCache = cache;
    console.log('[currency] Rates loaded from DB');
  } catch (err) {
    console.warn('[currency] Could not load rates from DB:', (err as Error).message);
  }
}

/** Returns the simple X→MAD base rates currently in use. */
export function getBaseRates(): Record<string, number> {
  return { ...ratesCache };
}

export function getRatesCache(): Record<string, Record<string, number>> {
  // Return full cross-table derived from base rates for API consumers that expect it
  const currencies = ['MAD', 'USD', 'EUR'];
  const full: Record<string, Record<string, number>> = {};
  for (const from of currencies) {
    full[from] = {};
    for (const to of currencies) {
      const fromToMAD = ratesCache[from] ?? TO_MAD_FALLBACK[from] ?? 1;
      const toToMAD   = ratesCache[to]   ?? TO_MAD_FALLBACK[to]   ?? 1;
      full[from][to] = from === to ? 1 : fromToMAD / toToMAD;
    }
  }
  return full;
}
