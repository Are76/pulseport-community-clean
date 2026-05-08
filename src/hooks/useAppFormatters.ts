import { useCallback, useMemo } from 'react';

/**
 * Hook for formatting numbers, prices, and UI colors based on theme.
 *
 * Provides formatter functions for display values and theme-aware color constants.
 * All formatters are memoized callbacks to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * const { fmtBigNum, fmtDec, fmtTok, themeColors } = useAppFormatters('dark');
 * return <span>{fmtBigNum(1234567)}</span>;
 * ```
 *
 * @param theme - Current theme ('light' or 'dark') for color selection
 * @returns Object with formatter functions and theme colors
 * @returns {function} returns.fmtBigNum - Format integer with thousand separators
 * @returns {function} returns.fmtDec - Format decimal number with specified precision
 * @returns {function} returns.fmtTok - Format token amount with M/K suffixes
 * @returns {function} returns.exportCSV - Download data as CSV file
 * @returns {object} returns.themeColors - Theme-aware color constants for UI
 */
export function useAppFormatters(theme: 'light' | 'dark') {
  const fmtBigNum = useCallback((n: number) => {
    return !isFinite(n) ? '0' : Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
  }, []);

  const fmtDec = useCallback((n: number, dp = 2) => {
    if (!isFinite(n)) return '0';
    const safeDp = Math.min(Math.max(Math.abs(dp), 0), 20);
    return n.toLocaleString('en-US', { minimumFractionDigits: safeDp, maximumFractionDigits: safeDp });
  }, []);

  const fmtTok = useCallback((n: number) => {
    if (!isFinite(n)) return '0';
    return n > 1e6 ? `${(n / 1e6).toFixed(2)}M` : n > 1000 ? `${(n / 1000).toFixed(2)}K` : n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }, []);

  const exportCSV = useCallback((filename: string, headers: string[], rows: (string | number)[][]) => {
    const escCell = (c: string | number) => {
      const s = String(c);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers, ...rows].map(r => r.map(escCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const themeColors = useMemo(() => ({
    surface: 'var(--bg-void)',
    card: 'var(--bg-surface)',
    cardHigh: 'var(--bg-elevated)',
    cardHighest: 'var(--bg-elevated)',
    border: 'var(--border)',
    borderLight: 'var(--border)',
    text: 'var(--fg)',
    textSecondary: 'var(--fg-muted)',
    textMuted: 'var(--fg-subtle)',
    textTertiary: 'var(--fg-subtle)',
    sidebar: 'var(--bg-sidebar)',
    header: 'var(--bg-header)',
    hoverBg: 'var(--bg-elevated)',
    expandedBg: 'var(--bg-elevated)',
    green: theme === 'dark' ? '#00FF9F' : '#059669',
    red: theme === 'dark' ? '#f43f5e' : '#dc2626',
    purple: '#8b5cf6',
    orange: '#f97316',
    blue: 'var(--chain-eth)',
    pink: 'var(--chain-pulse)',
    gradientHero: theme === 'dark'
      ? 'linear-gradient(135deg, #0b1a12 0%, #08100e 40%, #080d16 100%)'
      : 'linear-gradient(135deg, #eef8f4 0%, #f5f5f5 40%, #eef0fa 100%)',
  }), [theme]);

  return {
    fmtBigNum,
    fmtDec,
    fmtTok,
    exportCSV,
    themeColors,
  };
}
