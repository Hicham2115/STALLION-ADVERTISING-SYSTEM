import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency } from '@/types';
import { portalApi } from '@/context/PortalAuthContext';
import { formatCurrency } from '@/lib/utils';

const STORAGE_KEY = 'stallion_portal_currency';

// Base rates: 1 unit of X = N MAD. Derived inversely to guarantee perfect round-trips.
const TO_MAD: Record<string, number> = { MAD: 1, USD: 9.85, EUR: 10.85 };

interface PortalCurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amount: number, from?: Currency) => number;
  fmt: (amount: number, from?: Currency) => string;
}

const PortalCurrencyContext = createContext<PortalCurrencyContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

export function PortalCurrencyProvider({ children }: Props) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
    return stored || 'USD';
  });
  const [toMAD, setToMAD] = useState<Record<string, number>>(TO_MAD);

  useEffect(() => {
    portalApi.get<Record<string, Record<string, number>>>('/rates')
      .then(({ data }) => {
        if (!data || !Object.keys(data).length) return;
        const base: Record<string, number> = { MAD: 1 };
        for (const cur of ['USD', 'EUR']) {
          if (data[cur]?.MAD) base[cur] = data[cur].MAD;
        }
        setToMAD(base);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    localStorage.setItem(STORAGE_KEY, c);
    setCurrencyState(c);
  }, []);

  const convert = useCallback((amount: number, from: Currency = 'MAD') => {
    if (from === currency) return amount;
    return amount * (toMAD[from] ?? TO_MAD[from] ?? 1) / (toMAD[currency] ?? TO_MAD[currency] ?? 1);
  }, [currency, toMAD]);

  const fmt = useCallback((amount: number, from: Currency = 'MAD') => {
    return formatCurrency(convert(amount, from), currency);
  }, [convert, currency]);

  return (
    <PortalCurrencyContext.Provider value={{ currency, setCurrency, convert, fmt }}>
      {children}
    </PortalCurrencyContext.Provider>
  );
}

export function usePortalCurrency() {
  const ctx = useContext(PortalCurrencyContext);
  if (!ctx) throw new Error('usePortalCurrency must be used inside PortalCurrencyProvider');
  return ctx;
}
