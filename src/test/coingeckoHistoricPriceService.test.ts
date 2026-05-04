import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getHistoricPrice,
  getHistoricPrices,
  PriceCache,
  __clearCache,
} from '../services/coingeckoHistoricPriceService';

describe('coingeckoHistoricPriceService', () => {
  beforeEach(() => {
    // Clear cache before each test
    __clearCache();
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    __clearCache();
    sessionStorage.clear();
  });

  describe('getHistoricPrice', () => {
    it('should fetch historic price from API on first call', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: {
            current_usd: 2500.5,
          },
        }),
      });

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBe(2500.5);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should return cached price on subsequent calls for same token/date', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          market_data: {
            current_usd: 1500.0,
          },
        }),
      });

      const date = new Date('2025-06-15');

      // First call
      const price1 = await getHistoricPrice('ethereum', date);
      expect(price1).toBe(1500.0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const price2 = await getHistoricPrice('ethereum', date);
      expect(price2).toBe(1500.0);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should persist cache to sessionStorage', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: {
            current_usd: 3000.0,
          },
        }),
      });

      const date = new Date('2025-06-15');
      await getHistoricPrice('ethereum', date);

      const cached = sessionStorage.getItem('priceCache');
      expect(cached).toBeTruthy();

      const parsedCache: PriceCache = JSON.parse(cached!);
      expect(parsedCache.ethereum).toBeDefined();
      expect(parsedCache.ethereum['2025-06-15']).toBe(3000.0);
    });

    it('should restore cache from sessionStorage on module load', async () => {
      // Pre-populate sessionStorage with cache
      const cache: PriceCache = {
        ethereum: {
          '2025-06-15': 2800.0,
        },
      };
      sessionStorage.setItem('priceCache', JSON.stringify(cache));

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBe(2800.0);
      expect(mockFetch).not.toHaveBeenCalled(); // Should use cache, no API call
    });

    it('should return null for network error', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBeNull();
    });

    it('should return null for invalid token (404)', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('invalid-token-xyz', date);

      expect(price).toBeNull();
    });

    it('should return null when API response lacks market_data', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing market_data
          id: 'ethereum',
        }),
      });

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBeNull();
    });

    it('should format date as DD-MM-YYYY for API call', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: {
            current_usd: 1000.0,
          },
        }),
      });

      const date = new Date('2025-06-05'); // June 5
      await getHistoricPrice('bitcoin', date);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('05-06-2025'); // DD-MM-YYYY format
    });

    it('should implement rate limiting with 100ms delay between requests', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          market_data: {
            current_usd: 1000.0,
          },
        }),
      });

      const date1 = new Date('2025-06-15');
      const date2 = new Date('2025-06-16');

      const startTime = Date.now();

      // First call to different date - will make API call
      await getHistoricPrice('ethereum', date1);
      // Second call to different date - will make API call after delay
      await getHistoricPrice('ethereum', date2);

      const elapsedTime = Date.now() - startTime;

      // Should have taken at least 100ms due to rate limiting
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('getHistoricPrices', () => {
    it('should batch fetch multiple prices for same token', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock responses for two different dates
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: { current_usd: 2000.0 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: { current_usd: 2100.0 },
          }),
        });

      const dates = [new Date('2025-06-15'), new Date('2025-06-16')];
      const prices = await getHistoricPrices('ethereum', dates);

      expect(prices.get('2025-06-15')).toBe(2000.0);
      expect(prices.get('2025-06-16')).toBe(2100.0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return Map with ISO date string keys', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          market_data: { current_usd: 1500.0 },
        }),
      });

      const dates = [new Date('2025-06-15')];
      const prices = await getHistoricPrices('ethereum', dates);

      expect(prices).toBeInstanceOf(Map);
      expect(prices.has('2025-06-15')).toBe(true);
    });

    it('should use cached prices to minimize API calls', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Pre-populate one date in cache
      const cache: PriceCache = {
        ethereum: {
          '2025-06-15': 2000.0,
        },
      };
      sessionStorage.setItem('priceCache', JSON.stringify(cache));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: { current_usd: 2100.0 },
        }),
      });

      const dates = [
        new Date('2025-06-15'), // cached
        new Date('2025-06-16'), // not cached
      ];
      const prices = await getHistoricPrices('ethereum', dates);

      expect(prices.get('2025-06-15')).toBe(2000.0); // from cache
      expect(prices.get('2025-06-16')).toBe(2100.0); // from API
      expect(mockFetch).toHaveBeenCalledOnce(); // Only 1 API call for uncached date
    });

    it('should handle errors gracefully and include null for failed dates', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // First call succeeds, second fails
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: { current_usd: 2000.0 },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const dates = [new Date('2025-06-15'), new Date('2025-06-16')];
      const prices = await getHistoricPrices('ethereum', dates);

      expect(prices.get('2025-06-15')).toBe(2000.0);
      expect(prices.get('2025-06-16')).toBeNull();
    });

    it('should handle empty date array', async () => {
      const prices = await getHistoricPrices('ethereum', []);
      expect(prices).toBeInstanceOf(Map);
      expect(prices.size).toBe(0);
    });
  });

  describe('cache persistence and recovery', () => {
    it('should survive across multiple service calls', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          market_data: { current_usd: 1000.0 },
        }),
      });

      const date = new Date('2025-06-15');

      // First call - hits API
      const price1 = await getHistoricPrice('ethereum', date);
      expect(price1).toBe(1000.0);

      // Verify it's in sessionStorage
      const cached = sessionStorage.getItem('priceCache');
      expect(cached).toBeTruthy();

      // Simulate new module instance (would normally happen on page reload)
      // Clear mocks but keep sessionStorage
      mockFetch.mockClear();

      // Second call - should use sessionStorage cache
      const price2 = await getHistoricPrice('ethereum', date);
      expect(price2).toBe(1000.0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API response without current_usd field', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: {
            // Missing current_usd
          },
        }),
      });

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBeNull();
    });

    it('should handle malformed JSON response', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const date = new Date('2025-06-15');
      const price = await getHistoricPrice('ethereum', date);

      expect(price).toBeNull();
    });

    it('should include localization=false parameter in API call', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market_data: { current_usd: 1000.0 },
        }),
      });

      const date = new Date('2025-06-15');
      await getHistoricPrice('ethereum', date);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('localization=false');
    });
  });
});
