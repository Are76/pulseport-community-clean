/**
 * Centralized formatting utilities for price, number, and market value display.
 * Extracted from scattered definitions across tabs and components.
 */

/**
 * Format a numeric price with appropriate decimal places based on magnitude.
 * @param p - The price value
 * @returns Formatted price string
 */
export const fmtPrice = (p: number): string => {
  const abs = Math.abs(p);
  if (abs >= 1) return p.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (abs >= 0.01) return p.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 });
  if (abs >= 0.0001) return p.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 6 });
  if (abs >= 0.00000001) return p.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 8 });
  return p.toExponential(2);
};

/**
 * Format a number with locale-specific thousands separators.
 * @param val - The number to format
 * @returns Formatted number string
 */
export const fmtNum = (val: number): string => {
  if (!isFinite(val)) return '0';
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format an amount with compact notation (M for millions, K for thousands).
 * @param val - The amount to format
 * @returns Formatted amount string
 */
export const fmtAmount = (val: number): string => {
  if (!isFinite(val)) return '0';
  if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
  if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
  return val.toFixed(0);
};

/**
 * Format a number with compact notation (B for billions, M for millions, K for thousands).
 * @param n - The number to format
 * @returns Formatted number string
 */
export const fmtCompact = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return abs >= 1e9 ? `${sign}${(abs / 1e9).toFixed(2)}B` :
         abs >= 1e6 ? `${sign}${(abs / 1e6).toFixed(2)}M` :
         abs >= 1e3 ? `${sign}${(abs / 1e3).toFixed(1)}K` :
         n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format a market value with currency symbol and compact notation.
 * @param v - The value to format (optional/nullable)
 * @returns Formatted market value string
 */
export const fmtMarket = (v?: number | null): string =>
  v != null && v > 0
    ? v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : 'N/A';

/**
 * Format currency amount with dollar sign and thousand separators.
 * @param value - The value to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted currency string
 */
export const fmtCurrency = (value: number, decimals = 2): string => {
  if (!isFinite(value)) return '$0.00';
  if (value === 0) return '$0.00';
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
};

/**
 * Format percentage with appropriate decimal places.
 * @param percent - The percentage value
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted percentage string
 */
export const fmtPercent = (percent: number, decimals = 2): string => {
  if (!isFinite(percent)) return '0.00%';
  return percent.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + '%';
};
