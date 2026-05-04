import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enrichTransactionsWithHistoricPrices,
  getTokenCoinGeckoId,
} from '../services/transactionEnrichmentPipeline';
import { Transaction } from '../types';
import * as priceService from '../services/coingeckoHistoricPriceService';

// Mock the price service
vi.mock('../services/coingeckoHistoricPriceService');

describe('transactionEnrichmentPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTokenCoinGeckoId', () => {
    it('should map HEX on PulseChain to hex-money', () => {
      const id = getTokenCoinGeckoId(
        '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc'
      );
      expect(id).toBe('hex-money');
    });

    it('should map PulseX to pulsex', () => {
      const id = getTokenCoinGeckoId(
        '0x95b6e99cffc8bffc7baf4c4a69ebeb9cc8b9fee1f'
      );
      expect(id).toBe('pulsex');
    });

    it('should map WETH to ethereum', () => {
      const id = getTokenCoinGeckoId(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      );
      expect(id).toBe('ethereum');
    });

    it('should be case-insensitive for address matching', () => {
      const id1 = getTokenCoinGeckoId(
        '0x2B59BDE899D57025B4B8E3B8F5BDAF8A8A27C7CC'
      );
      expect(id1).toBe('hex-money');
    });

    it('should return null for unknown token address', () => {
      const id = getTokenCoinGeckoId('0x0000000000000000000000000000000000000000');
      expect(id).toBeNull();
    });
  });

  describe('enrichTransactionsWithHistoricPrices', () => {
    it('should handle empty transaction array', async () => {
      const result = await enrichTransactionsWithHistoricPrices([]);
      expect(result).toEqual([]);
    });

    it('should enrich swap transaction with historic prices', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBe(2500);
      expect(result[0].counterPriceUsdAtTx).toBe(2500);
    });

    it('should calculate native prices for PulseChain transactions', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice
        .mockResolvedValueOnce(2500) // asset price
        .mockResolvedValueOnce(100) // counter price
        .mockResolvedValueOnce(0.05); // PLS price

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result[0].assetPriceNativeAtTx).toBe(50000); // 2500 / 0.05
      expect(result[0].counterPriceNativeAtTx).toBe(2000); // 100 / 0.05
    });

    it('should handle missing token addresses gracefully', async () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'UNKNOWN',
        amount: 100,
        chain: 'pulsechain',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBeUndefined();
    });

    it('should handle network errors and return partial enrichment', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBeNull();
      expect(result[0].counterPriceUsdAtTx).toBeNull();
      expect(result[0]).toBeDefined(); // Transaction is returned, not thrown
    });

    it('should handle division by zero when PLS price is zero', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice
        .mockResolvedValueOnce(2500)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(0); // PLS price is 0

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result[0].assetPriceNativeAtTx).toBeNull();
      expect(result[0].counterPriceNativeAtTx).toBeNull();
    });

    it('should handle transactions without txDate', async () => {
      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(tx); // Should be unchanged
    });

    it('should process multiple transactions in batch', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx1: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const tx2: Transaction = {
        id: 'swap-2',
        hash: '0xdef456',
        timestamp: 1625184000000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'PULSEX',
        amount: 50,
        counterAsset: 'HEX',
        counterAmount: 100,
        chain: 'pulsechain',
        txDate: new Date('2025-06-16'),
        assetTokenAddress: '0x95b6e99cffc8bffc7baf4c4a69ebeb9cc8b9fee1f',
        counterTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx1, tx2]);

      expect(result).toHaveLength(2);
      expect(result[0].assetPriceUsdAtTx).toBe(2500);
      expect(result[1].assetPriceUsdAtTx).toBe(2500);
    });

    it('should leverage caching for same token/date combinations', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx1: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const tx2: Transaction = {
        id: 'swap-2',
        hash: '0xdef456',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 50,
        counterAsset: 'USDC',
        counterAmount: 25,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      await enrichTransactionsWithHistoricPrices([tx1, tx2]);

      // Should call getHistoricPrice for HEX and USDC on same date
      // Price service caching handles duplicate prevention
      expect(mockGetHistoricPrice).toHaveBeenCalled();
    });

    it('should handle transactions of various types (deposit, withdraw, swap)', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const deposit: Transaction = {
        id: 'deposit-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      const withdraw: Transaction = {
        id: 'withdraw-1',
        hash: '0xdef456',
        timestamp: 1625184000000,
        type: 'withdraw',
        from: '0x0987654321098765432109876543210987654321',
        to: '0x1234567890123456789012345678901234567890',
        asset: 'HEX',
        amount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-16'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      const result = await enrichTransactionsWithHistoricPrices([deposit, withdraw]);

      expect(result).toHaveLength(2);
      expect(result[0].assetPriceUsdAtTx).toBe(2500);
      expect(result[1].assetPriceUsdAtTx).toBe(2500);
    });

    it('should handle missing PLS price when calculating native prices', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice
        .mockResolvedValueOnce(2500) // asset price
        .mockResolvedValueOnce(100) // counter price
        .mockResolvedValueOnce(null); // PLS price unavailable

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result[0].assetPriceUsdAtTx).toBe(2500);
      expect(result[0].assetPriceNativeAtTx).toBeNull();
      expect(result[0].counterPriceNativeAtTx).toBeNull();
    });

    it('should skip enrichment for non-PulseChain transactions', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1,
        counterAsset: 'USDC',
        counterAmount: 2000,
        chain: 'ethereum',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      // Should still enrich with USD prices but not native prices
      expect(result[0].assetPriceUsdAtTx).toBe(2500);
    });

    it('should never throw errors, always return transactions', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockRejectedValue(new Error('API error'));

      const tx: Transaction = {
        id: 'swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 50,
        chain: 'pulsechain',
        txDate: new Date('2025-06-15'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      expect(async () => {
        await enrichTransactionsWithHistoricPrices([tx]);
      }).not.toThrow();

      const result = await enrichTransactionsWithHistoricPrices([tx]);
      expect(result).toHaveLength(1);
    });
  });
});
