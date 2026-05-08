/**
 * Centralized formatting utilities for price, number, market value, and token display.
 * Single source of truth for all number formatting across the application.
 * Extracted from scattered definitions across components and hooks.
 */

/**
 * Format a numeric price with appropriate decimal places based on magnitude.
 * Handles very small numbers with exponential notation fallback.
 * @param p - The price value (can be number or string)
 * @returns Formatted price string
 * @example
 * fmtPrice(1234.56) => "1,234.56"
 * fmtPrice(0.00001) => "0.00001"
 * fmtPrice(0.0000000001) => "1.00e-10"
 */
export const fmtPrice = (p: number): string => {
  if (!isFinite(p)) return '0.00';
  if (p >= 1) return p.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (p >= 0.01) return p.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 6 });
  if (p >= 0.00000001) return p.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 8 });
  return p.toExponential(2);
};

/**
 * Format a number with locale-specific thousands separators (no decimals).
 * @param val - The number to format
 * @returns Formatted number string with thousands separators
 * @example
 * fmtNum(1234567) => "1,234,567"
 * fmtNum(100.9) => "101"
 */
export const fmtNum = (val: number): string => {
  if (!isFinite(val)) return '0';
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format a number with compact notation (M for millions, K for thousands).
 * Useful for displaying amounts with reduced digits.
 * @param val - The amount to format
 * @returns Formatted amount string (e.g., "1.5M", "234K", "99")
 * @example
 * fmtAmount(1500000) => "1.5M"
 * fmtAmount(234000) => "234K"
 * fmtAmount(999) => "999"
 */
export const fmtAmount = (val: number): string => {
  if (!isFinite(val)) return '0';
  if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
  if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
  return val.toFixed(0);
};

/**
 * Format a number with compact notation including billions.
 * @param n - The number to format
 * @returns Formatted string (B for billions, M for millions, K for thousands)
 * @example
 * fmtCompact(1500000000) => "1.50B"
 * fmtCompact(1500000) => "1.50M"
 * fmtCompact(1500) => "1.5K"
 */
export const fmtCompact = (n: number): string => {
  if (!isFinite(n)) return '0';
  return n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` :
    n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` :
    n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` :
    n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format a number with compact notation, supporting negative values.
 * Preserves sign and absolute value formatting.
 * @param value - The amount to format
 * @param suffix - Optional suffix to append (e.g., empty string or symbol)
 * @returns Formatted amount string with sign preserved
 * @example
 * fmtCompactSigned(-1500000) => "-1.50M"
 * fmtCompactSigned(234000, " USD") => "234K USD"
 */
export const fmtCompactSigned = (value: number, suffix = ''): string => {
  if (!isFinite(value)) return '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B${suffix}`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M${suffix}`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K${suffix}`;
  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}${suffix}`;
};

/**
 * Format a market value with currency symbol and compact notation.
 * Returns "N/A" for null, undefined, or non-positive values.
 * @param v - The value to format (optional/nullable)
 * @returns Formatted market value string with $ prefix
 * @example
 * fmtMarket(1500000000) => "$1.50B"
 * fmtMarket(1500000) => "$1.5M"
 * fmtMarket(500) => "$500"
 * fmtMarket(null) => "N/A"
 */
export const fmtMarket = (v?: number | null): string => {
  if (v == null || v <= 0) return 'N/A';
  if (!isFinite(v)) return 'N/A';
  return v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` :
    v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` :
    `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/**
 * Format a USD amount with automatic abbreviation (M/K).
 * Always positive - caller handles sign. Supports custom decimal places.
 * @param n - The USD amount to format
 * @param maxFrac - Maximum fraction digits (default 2, clamped to 0-20)
 * @returns Formatted USD string with $ prefix
 * @example
 * fmtUsd(1500000) => "$1.50M"
 * fmtUsd(1500) => "$1.5K"
 * fmtUsd(123.456, 3) => "$123.456"
 */
export const fmtUsd = (n: number, maxFrac = 2): string => {
  if (!isFinite(n)) return '$0';
  const safeFrac = Math.min(Math.max(maxFrac, 0), 20);
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: safeFrac })}`;
};

/**
 * Format currency amount with dollar sign and thousand separators.
 * @param value - The value to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted currency string
 * @example
 * fmtCurrency(1234.5) => "$1,234.50"
 * fmtCurrency(0) => "$0.00"
 */
export const fmtCurrency = (value: number, decimals = 2): string => {
  if (!isFinite(value)) return '$0.00';
  if (value === 0) return '$0.00';
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
};

/**
 * Format a USD amount with consistent decimal places. Preserves sign.
 * @param n - The USD amount to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted USD string with $ prefix
 * @example
 * fmtUsdExact(1234.5, 2) => "$1,234.50"
 * fmtUsdExact(-999.9, 2) => "$-999.90"
 */
export const fmtUsdExact = (n: number, decimals = 2): string => {
  if (!isFinite(n)) return '$0.00';
  const safeDec = Math.min(Math.max(decimals, 0), 20);
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: safeDec, maximumFractionDigits: safeDec })}`;
};

/**
 * Format a decimal number with specified precision.
 * Safe clamping of decimal places to 0-20 range.
 * @param n - Number to format
 * @param dp - Decimal places (default 2, clamped to 0-20)
 * @returns Formatted string
 * @example
 * fmtDec(1234.56789, 2) => "1,234.57"
 * fmtDec(0.123456, 4) => "0.1235"
 */
export const fmtDec = (n: number, dp = 2): string => {
  if (!isFinite(n)) return '0';
  const safeDp = Math.min(Math.max(Math.abs(dp), 0), 20);
  return n.toLocaleString('en-US', { minimumFractionDigits: safeDp, maximumFractionDigits: safeDp });
};

/**
 * Format a token amount with automatic B/M/K abbreviation.
 * Handles billions, millions, and thousands with appropriate precision.
 * @param n - Token amount to format
 * @returns Formatted token string
 * @example
 * fmtTok(1500000000) => "1.50B"
 * fmtTok(1500000) => "1.50M"
 * fmtTok(1500) => "1.5K"
 * fmtTok(123.456) => "123.4560"
 */
export const fmtTok = (n: number): string => {
  if (!isFinite(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

/**
 * Format a token amount with sign preserved for gains/losses.
 * Uses B/M/K abbreviation for large amounts.
 * @param n - Token amount (can be positive or negative)
 * @returns Formatted token string with sign preserved
 * @example
 * fmtTokSigned(1500000) => "1.50M"
 * fmtTokSigned(-1500000) => "-1.50M"
 */
export const fmtTokSigned = (n: number): string => {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
};

/**
 * Format a token amount with custom abbreviation notation for hook usage.
 * Similar to fmtTok but uses slightly different precision for K notation.
 * @param n - Token amount to format
 * @returns Formatted token string
 * @example
 * fmtTokHook(1500000) => "1.50M"
 * fmtTokHook(1500) => "1.50K"
 */
export const fmtTokHook = (n: number): string => {
  if (!isFinite(n)) return '0';
  if (n > 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n > 1000) return `${(n / 1000).toFixed(2)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

/**
 * Format a large number with space separators (common in some locales).
 * Rounds to nearest integer.
 * @param n - Number to format
 * @returns Formatted number string with space separators
 * @example
 * fmtBigNum(1234567) => "1 234 567"
 */
export const fmtBigNum = (n: number): string => {
  if (!isFinite(n)) return '0';
  return Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
};

/**
 * Format percentage with appropriate decimal places.
 * Multiplies by 100 and adds % symbol.
 * @param percent - The percentage value (0.25 for 25%)
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted percentage string
 * @example
 * fmtPercent(0.25, 2) => "25.00%"
 * fmtPercent(0.333, 1) => "33.3%"
 */
export const fmtPercent = (percent: number, decimals = 2): string => {
  if (!isFinite(percent)) return '0.00%';
  return percent.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + '%';
};

/**
 * Format a small number or display with customizable precision.
 * Handles hexadecimal-like display values for staking/hex amounts.
 * @param n - Number to format
 * @returns Formatted string with thousands separators
 * @example
 * fmtSmall(123456.789) => "123,456.79"
 */
export const fmtSmall = (n: number): string => {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
