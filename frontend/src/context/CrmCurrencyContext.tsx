import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

export type CrmCurrency = 'MAD' | 'USD' | 'EUR';

const SYMBOLS: Record<CrmCurrency, string> = { MAD: 'MAD', USD: '$', EUR: '€' };
// Base rates: 1 unit of X = N MAD. Derive all conversions from these for perfect round-trips.
const TO_MAD: Record<string, number> = { MAD: 1, USD: 9.85, EUR: 10.85 };

interface CrmCurrencyCtx {
  currency: CrmCurrency;
  setCurrency: (c: CrmCurrency) => void;
  fmt: (amount: number, fromCurrency?: CrmCurrency) => string;
  convert: (amount: number, fromCurrency?: CrmCurrency) => number;
}

const Ctx = createContext<CrmCurrencyCtx>({
  currency: 'MAD',
  setCurrency: () => {},
  fmt: (n) => n.toLocaleString('en-MA', { maximumFractionDigits: 0 }) + ' MAD',
  convert: (n) => n,
});

export function CrmCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CrmCurrency>('MAD');
  // toMAD[X] = "1 unit of X in MAD" — only store base rates, derive all else
  const [toMAD, setToMAD] = useState<Record<string, number>>(TO_MAD);

  useEffect(() => {
    api.get<Record<string, Record<string, number>>>('/crm/rates')
      .then(({ data }) => {
        // API returns full cross-table; extract X→MAD column
        const base: Record<string, number> = { MAD: 1 };
        for (const cur of ['USD', 'EUR']) {
          if (data[cur]?.MAD) base[cur] = data[cur].MAD;
        }
        setToMAD(base);
      })
      .catch(() => {});
  }, []);

  const convert = (amount: number, from: CrmCurrency = 'MAD'): number => {
    if (from === currency) return amount;
    return amount * (toMAD[from] ?? TO_MAD[from] ?? 1) / (toMAD[currency] ?? TO_MAD[currency] ?? 1);
  };

  const fmt = (amount: number, from: CrmCurrency = 'MAD'): string => {
    const converted = convert(amount, from);
    if (currency === 'USD') return '$' + converted.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (currency === 'EUR') return '€' + converted.toLocaleString('en-DE', { maximumFractionDigits: 0 });
    return converted.toLocaleString('en-MA', { maximumFractionDigits: 0 }) + ' MAD';
  };

  return <Ctx.Provider value={{ currency, setCurrency, fmt, convert }}>{children}</Ctx.Provider>;
}

export function useCrmCurrency() { return useContext(Ctx); }
export { SYMBOLS };
