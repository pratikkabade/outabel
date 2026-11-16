export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'AUD' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  JPY: { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  CAD: { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
};

export const formatCurrency = (amount: number, currency: CurrencyCode = 'USD'): string => {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const formatted = Math.round(amount).toLocaleString();
  return `${config.symbol}${formatted}`;
};
