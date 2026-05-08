import {
  fmtPrice,
  fmtNum,
  fmtAmount,
  fmtCompact,
  fmtCompactSigned,
  fmtMarket,
  fmtUsd,
  fmtCurrency,
  fmtUsdExact,
  fmtDec,
  fmtTok,
  fmtTokSigned,
  fmtTokHook,
  fmtBigNum,
  fmtPercent,
  fmtSmall,
} from '../utils/formatting';

describe('formatting utilities', () => {
  describe('fmtPrice', () => {
    it('formats prices >= 1 with 2 decimals', () => {
      expect(fmtPrice(1234.56)).toBe('1,234.56');
      expect(fmtPrice(1)).toBe('1.00');
      expect(fmtPrice(100.1)).toBe('100.10');
    });

    it('formats prices 0.01-1 with 4 decimals', () => {
      expect(fmtPrice(0.123)).toBe('0.1230');
      expect(fmtPrice(0.01)).toBe('0.0100');
    });

    it('formats prices 0.0001-0.01 with 6 decimals', () => {
      expect(fmtPrice(0.0001)).toBe('0.000100');
      expect(fmtPrice(0.000001)).toBe('0.00000100');
    });

    it('handles very small numbers with exponential notation', () => {
      expect(fmtPrice(0.0000000001)).toBe('1.00e-10');
    });

    it('handles invalid inputs', () => {
      expect(fmtPrice(NaN)).toBe('0.00');
      expect(fmtPrice(Infinity)).toBe('0.00');
    });
  });

  describe('fmtNum', () => {
    it('formats large numbers with thousands separators', () => {
      expect(fmtNum(1234567)).toBe('1,234,567');
      expect(fmtNum(1000)).toBe('1,000');
    });

    it('rounds decimal numbers', () => {
      expect(fmtNum(100.9)).toBe('101');
      expect(fmtNum(100.4)).toBe('100');
    });

    it('handles edge cases', () => {
      expect(fmtNum(0)).toBe('0');
      expect(fmtNum(-1234)).toBe('-1,234');
      expect(fmtNum(NaN)).toBe('0');
    });
  });

  describe('fmtAmount', () => {
    it('formats millions correctly', () => {
      expect(fmtAmount(1500000)).toBe('1.5M');
      expect(fmtAmount(1000000)).toBe('1.0M');
    });

    it('formats thousands correctly', () => {
      expect(fmtAmount(234000)).toBe('234.0K');
      expect(fmtAmount(1000)).toBe('1.0K');
    });

    it('formats small amounts without abbreviation', () => {
      expect(fmtAmount(999)).toBe('999');
      expect(fmtAmount(1)).toBe('1');
    });

    it('handles invalid inputs', () => {
      expect(fmtAmount(NaN)).toBe('0');
      expect(fmtAmount(Infinity)).toBe('0');
    });
  });

  describe('fmtCompact', () => {
    it('formats billions correctly', () => {
      expect(fmtCompact(1500000000)).toBe('1.50B');
      expect(fmtCompact(1000000000)).toBe('1.00B');
    });

    it('formats millions correctly', () => {
      expect(fmtCompact(1500000)).toBe('1.50M');
      expect(fmtCompact(1000000)).toBe('1.00M');
    });

    it('formats thousands correctly', () => {
      expect(fmtCompact(1500)).toBe('1.5K');
      expect(fmtCompact(1000)).toBe('1.0K');
    });

    it('formats numbers without abbreviation', () => {
      expect(fmtCompact(999)).toBe('999');
      expect(fmtCompact(0)).toBe('0');
    });

    it('handles invalid inputs', () => {
      expect(fmtCompact(NaN)).toBe('0');
    });
  });

  describe('fmtCompactSigned', () => {
    it('preserves negative sign with abbreviations', () => {
      expect(fmtCompactSigned(-1500000)).toBe('-1.50M');
      expect(fmtCompactSigned(-1500)).toBe('-1.50K');
    });

    it('handles positive values', () => {
      expect(fmtCompactSigned(1500000)).toBe('1.50M');
      expect(fmtCompactSigned(1500)).toBe('1.50K');
    });

    it('appends suffix when provided', () => {
      expect(fmtCompactSigned(1500000, ' USD')).toBe('1.50M USD');
      expect(fmtCompactSigned(-1500000, ' $')).toBe('-1.50M $');
    });
  });

  describe('fmtMarket', () => {
    it('formats billions with $ prefix', () => {
      expect(fmtMarket(1500000000)).toBe('$1.50B');
      expect(fmtMarket(1000000000)).toBe('$1.00B');
    });

    it('formats millions with $ prefix', () => {
      expect(fmtMarket(1500000)).toBe('$1.5M');
      expect(fmtMarket(1000000)).toBe('$1.0M');
    });

    it('formats smaller amounts with $ prefix', () => {
      expect(fmtMarket(1500)).toBe('$1,500');
      expect(fmtMarket(100)).toBe('$100');
    });

    it('returns N/A for null/undefined/non-positive', () => {
      expect(fmtMarket(null)).toBe('N/A');
      expect(fmtMarket(undefined)).toBe('N/A');
      expect(fmtMarket(0)).toBe('N/A');
      expect(fmtMarket(-100)).toBe('N/A');
      expect(fmtMarket(NaN)).toBe('N/A');
    });
  });

  describe('fmtUsd', () => {
    it('formats millions correctly', () => {
      expect(fmtUsd(1500000)).toBe('$1.50M');
      expect(fmtUsd(1000000)).toBe('$1.00M');
    });

    it('formats thousands correctly', () => {
      expect(fmtUsd(1500)).toBe('$1.5K');
      expect(fmtUsd(1000)).toBe('$1.0K');
    });

    it('formats smaller amounts with custom precision', () => {
      expect(fmtUsd(123.456, 3)).toBe('$123.456');
      expect(fmtUsd(123.456, 2)).toBe('$123.46');
    });

    it('clamps decimal places to 0-20', () => {
      expect(fmtUsd(100, -5)).toBe('$100');
      expect(fmtUsd(100, 100)).toBe('$100');
    });

    it('handles invalid inputs', () => {
      expect(fmtUsd(NaN)).toBe('$0');
      expect(fmtUsd(Infinity)).toBe('$0');
    });
  });

  describe('fmtCurrency', () => {
    it('formats with default 2 decimal places', () => {
      expect(fmtCurrency(1234.5)).toBe('$1,234.50');
      expect(fmtCurrency(100)).toBe('$100.00');
    });

    it('formats with custom decimal places', () => {
      expect(fmtCurrency(1234.567, 3)).toBe('$1,234.567');
      expect(fmtCurrency(1234, 0)).toBe('$1,234');
    });

    it('handles zero', () => {
      expect(fmtCurrency(0)).toBe('$0.00');
    });

    it('handles invalid inputs', () => {
      expect(fmtCurrency(NaN)).toBe('$0.00');
    });
  });

  describe('fmtUsdExact', () => {
    it('formats with consistent decimal places', () => {
      expect(fmtUsdExact(1234.5, 2)).toBe('$1,234.50');
      expect(fmtUsdExact(100, 2)).toBe('$100.00');
    });

    it('handles negative values', () => {
      expect(fmtUsdExact(-999.9, 2)).toBe('$999.90');
    });

    it('clamps decimal places to 0-20', () => {
      expect(fmtUsdExact(100, -5)).toBe('$100');
      expect(fmtUsdExact(100, 100)).toMatch(/^\$100\./);
    });
  });

  describe('fmtDec', () => {
    it('formats with specified decimal places', () => {
      expect(fmtDec(1234.56789, 2)).toBe('1,234.57');
      expect(fmtDec(0.123456, 4)).toBe('0.1235');
    });

    it('uses default of 2 decimals', () => {
      expect(fmtDec(100.456)).toBe('100.46');
    });

    it('clamps decimal places to 0-20', () => {
      expect(fmtDec(100, -5)).toBe('100.00000');
      expect(fmtDec(100, 100)).toMatch(/^100\./);
    });

    it('handles invalid inputs', () => {
      expect(fmtDec(NaN)).toBe('0');
    });
  });

  describe('fmtTok', () => {
    it('formats billions correctly', () => {
      expect(fmtTok(1500000000)).toBe('1.50B');
      expect(fmtTok(1000000000)).toBe('1.00B');
    });

    it('formats millions correctly', () => {
      expect(fmtTok(1500000)).toBe('1.50M');
      expect(fmtTok(1000000)).toBe('1.00M');
    });

    it('formats thousands correctly', () => {
      expect(fmtTok(1500)).toBe('1.5K');
      expect(fmtTok(1000)).toBe('1.0K');
    });

    it('formats small amounts with 4 decimals', () => {
      expect(fmtTok(123.456)).toBe('123.456');
      expect(fmtTok(0.123)).toBe('0.123');
    });

    it('handles invalid inputs', () => {
      expect(fmtTok(NaN)).toBe('0');
    });
  });

  describe('fmtTokSigned', () => {
    it('preserves sign with abbreviations', () => {
      expect(fmtTokSigned(1500000)).toBe('1.50M');
      expect(fmtTokSigned(-1500000)).toBe('-1.50M');
      expect(fmtTokSigned(1500)).toBe('1.5K');
      expect(fmtTokSigned(-1500)).toBe('-1.5K');
    });

    it('handles small amounts with sign', () => {
      expect(fmtTokSigned(123.456)).toBe('123.456');
      expect(fmtTokSigned(-123.456)).toBe('-123.456');
    });
  });

  describe('fmtTokHook', () => {
    it('formats millions with K notation', () => {
      expect(fmtTokHook(1500000)).toBe('1.50M');
      expect(fmtTokHook(1500)).toBe('1.50K');
    });

    it('formats without abbreviation for small amounts', () => {
      expect(fmtTokHook(100.123)).toBe('100.123');
    });
  });

  describe('fmtBigNum', () => {
    it('formats with space separators instead of commas', () => {
      expect(fmtBigNum(1234567)).toBe('1 234 567');
      expect(fmtBigNum(1000000)).toBe('1 000 000');
    });

    it('rounds to nearest integer', () => {
      expect(fmtBigNum(1234.567)).toBe('1 235');
      expect(fmtBigNum(1234.4)).toBe('1 234');
    });

    it('handles invalid inputs', () => {
      expect(fmtBigNum(NaN)).toBe('0');
    });
  });

  describe('fmtPercent', () => {
    it('formats with % symbol and decimals', () => {
      expect(fmtPercent(0.25, 2)).toBe('0.25%');
      expect(fmtPercent(0.333, 1)).toBe('0.3%');
    });

    it('uses default of 2 decimals', () => {
      expect(fmtPercent(0.5)).toBe('0.50%');
    });

    it('handles invalid inputs', () => {
      expect(fmtPercent(NaN)).toBe('0.00%');
      expect(fmtPercent(Infinity)).toBe('0.00%');
    });
  });

  describe('fmtSmall', () => {
    it('formats with 2 decimal places', () => {
      expect(fmtSmall(123456.789)).toBe('123,456.79');
      expect(fmtSmall(100)).toBe('100.00');
    });

    it('handles invalid inputs', () => {
      expect(fmtSmall(NaN)).toBe('0');
    });
  });

  describe('consistency across similar functions', () => {
    it('fmtTok and fmtTokHook handle same inputs similarly', () => {
      const testValue = 1500000;
      // Both should abbreviate to M
      expect(fmtTok(testValue)).toContain('M');
      expect(fmtTokHook(testValue)).toContain('M');
    });

    it('fmtUsd and fmtMarket handle positive values consistently', () => {
      const testValue = 1500000;
      const usd = fmtUsd(testValue);
      const market = fmtMarket(testValue);
      // Both should have $ and similar abbreviation
      expect(usd).toContain('$');
      expect(market).toContain('$');
      expect(market).toContain('M');
    });

    it('negative values handled by signed variants', () => {
      expect(fmtTokSigned(-100)).toContain('-');
      expect(fmtCompactSigned(-100)).toContain('-');
    });
  });

  describe('edge cases and boundary values', () => {
    it('handles zero across all functions', () => {
      expect(fmtPrice(0)).toBe('0.00e+0');
      expect(fmtNum(0)).toBe('0');
      expect(fmtAmount(0)).toBe('0');
      expect(fmtTok(0)).toBe('0');
      expect(fmtCompact(0)).toBe('0');
    });

    it('handles boundary between abbreviations', () => {
      // Just below K
      expect(fmtCompact(999)).toBe('999');
      // Just at K
      expect(fmtCompact(1000)).toContain('K');
      // Just below M
      expect(fmtCompact(999999)).toContain('K');
      // Just at M
      expect(fmtCompact(1000000)).toContain('M');
    });

    it('handles very large numbers', () => {
      expect(fmtCompact(999999999999)).toBe('1000.00B');
      expect(fmtMarket(999999999999)).toContain('B');
    });

    it('handles very small decimal numbers', () => {
      expect(fmtPrice(0.00000001)).toBe('0.00000001');
      expect(fmtPrice(0.000000001)).toBe('1.00e-9');
    });
  });

  describe('locale and symbol handling', () => {
    it('all currency functions use $ prefix', () => {
      expect(fmtCurrency(100)).toMatch(/^\$/);
      expect(fmtUsd(100)).toMatch(/^\$/);
      expect(fmtMarket(100)).toMatch(/^\$/);
      expect(fmtUsdExact(100)).toMatch(/^\$/);
    });

    it('all abbreviation functions use B/M/K suffixes', () => {
      const tests = [
        [fmtCompact(1e9), 'B'],
        [fmtCompact(1e6), 'M'],
        [fmtCompact(1e3), 'K'],
        [fmtTok(1e9), 'B'],
        [fmtTok(1e6), 'M'],
        [fmtTok(1e3), 'K'],
      ];
      tests.forEach(([result, suffix]) => {
        expect(result).toContain(suffix);
      });
    });

    it('percentage function adds % symbol', () => {
      expect(fmtPercent(0.5)).toMatch(/%$/);
      expect(fmtPercent(1)).toMatch(/%$/);
    });
  });
});
