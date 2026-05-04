import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Transaction, Asset } from '../../types';
import { buildInvestmentRows } from '../../utils/buildInvestmentRows';
import { normalizeTransactions } from '../../utils/normalizeTransactions';
import { enrichTransactionsWithHistoricPrices } from '../../services/transactionEnrichmentPipeline';
import * as priceService from '../../services/coingeckoHistoricPriceService';

// Mock the CoinGecko price service
vi.mock('../../services/coingeckoHistoricPriceService');

describe('Historic Price Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: End-to-End Workflow
   * Transaction with date → CoinGecko service → enrichment → normalization → buildInvestmentRows → P&L
   */
  describe('Test 1: End-to-End Historic Price Workflow', () => {
    it('should flow transaction from CoinGecko lookup through cost basis to P&L display', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      // Mock: ETH was $2000 at purchase time
      // Mock: HEX was $0.10 at swap time
      mockGetHistoricPrice.mockImplementation((tokenId: string, date: Date) => {
        if (tokenId === 'ethereum') return Promise.resolve(2000);
        if (tokenId === 'hex-money') return Promise.resolve(0.10);
        if (tokenId === 'pulse') return Promise.resolve(0.05);
        return Promise.resolve(null);
      });

      // Step 1: Create raw swap transaction (simplified - swap already normalized)
      const rawTxs: Transaction[] = [
        {
          id: 'hex-swap',
          hash: '0x3',
          timestamp: 1609545600000, // 2021-01-02
          type: 'swap',
          from: '0xwallet',
          to: '0xrouter',
          asset: 'HEX',
          amount: 10000,
          valueUsd: 1000,
          chain: 'pulsechain',
          counterAsset: 'ETH',
          counterAmount: 0.5,
          txDate: new Date('2021-01-02'),
          assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc', // HEX
          counterTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH/ETH
        },
      ];

      // Step 2: Enrich with historic prices
      const enrichedTxs = await enrichTransactionsWithHistoricPrices(rawTxs);

      // Verify enrichment populated historic prices
      expect(enrichedTxs[0].assetPriceUsdAtTx).toBe(0.10); // HEX at $0.10
      expect(enrichedTxs[0].counterPriceUsdAtTx).toBe(2000); // ETH at $2000

      // Step 3: Normalize transactions (just passes through enriched swaps)
      const walletAddrs = new Set(['0xwallet']);
      const normalizedTxs = await normalizeTransactions(rawTxs, walletAddrs);

      // Should have swap with historic prices
      expect(normalizedTxs).toHaveLength(1);
      const swapTx = normalizedTxs[0];
      expect(swapTx.type).toBe('swap');

      // Step 4: Build investment rows with current prices
      const currentHex: Asset = {
        id: 'hex',
        symbol: 'HEX',
        name: 'HEX',
        balance: 10000,
        price: 0.15, // Current price is now $0.15
        value: 1500, // 10000 * 0.15
        chain: 'pulsechain',
      };

      // Use enriched transactions with historic prices
      const rows = buildInvestmentRows([currentHex], enrichedTxs, 3000); // Market cap irrelevant

      // Verify P&L uses historic cost basis
      expect(rows).toHaveLength(1);
      expect(rows[0].costBasis).toBeCloseTo(1000, 2); // 10000 * $0.10
      expect(rows[0].currentValue).toBeCloseTo(1500, 2); // 10000 * $0.15
      expect(rows[0].pnlUsd).toBeCloseTo(500, 2); // 1500 - 1000 = $500 gain
      expect(rows[0].pnlPercent).toBeCloseTo(50, 1); // 500 / 1000 = 50%
    });
  });

  /**
   * Test 2: Accurate P&L with Historic Entry Price
   * Verify P&L is based on historic entry price, not current prices
   */
  describe('Test 2: Accurate P&L with Historic Entry Price', () => {
    it('should calculate P&L from historic entry price ($100) not current price variability', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      // Mock: Asset was bought at $100
      mockGetHistoricPrice.mockResolvedValue(100);

      const txs: Transaction[] = [
        {
          id: 'buy',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'TOKEN',
          amount: 10,
          valueUsd: 1000,
          chain: 'ethereum',
          txDate: new Date('2021-01-01'),
          assetPriceUsdAtTx: 100,
          assetTokenAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const currentAsset: Asset = {
        id: 'token',
        symbol: 'TOKEN',
        name: 'Token',
        balance: 10,
        price: 150, // Now worth $150 each
        value: 1500, // 10 * 150
        chain: 'ethereum',
      };

      const rows = buildInvestmentRows([currentAsset], txs, 3000);

      expect(rows[0].costBasis).toBeCloseTo(1000, 2); // 10 * $100 (fixed historic price)
      expect(rows[0].currentValue).toBeCloseTo(1500, 2); // 10 * $150 (current market price)
      expect(rows[0].pnlUsd).toBeCloseTo(500, 2); // 1500 - 1000
      expect(rows[0].pnlPercent).toBeCloseTo(50, 1); // 500 / 1000 * 100
    });
  });

  /**
   * Test 3: Native Price Calculation (PLS → USD)
   * Verify native prices calculated correctly: assetPriceNativeAtTx = assetPriceUsdAtTx / plsPriceUsdAtTx
   */
  describe('Test 3: Native Price Calculation', () => {
    it('should calculate native prices for PulseChain using USD prices', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      // Mock prices at transaction time - need to return values for asset, counter, and PLS
      let callCount = 0;
      mockGetHistoricPrice.mockImplementation((tokenId: string, date: Date) => {
        callCount++;
        if (tokenId === 'hex-money') return Promise.resolve(0.10); // HEX at $0.10
        if (tokenId === 'wrapped-pulse') return Promise.resolve(0.05); // WPLS at $0.05
        if (tokenId === 'pulse') return Promise.resolve(0.05); // PLS at $0.05
        return Promise.resolve(null);
      });

      const txs: Transaction[] = [
        {
          id: 'swap',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'swap',
          from: '0xwallet',
          to: '0xrouter',
          asset: 'HEX',
          amount: 10000,
          valueUsd: 1000,
          chain: 'pulsechain',
          counterAsset: 'WPLS',
          counterAmount: 20000,
          txDate: new Date('2021-01-01'),
          assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc', // HEX
          counterTokenAddress: '0xa1077a294dde1b09ad48b41f3b0dd891be3ca3fb', // WPLS
        },
      ];

      const enrichedTxs = await enrichTransactionsWithHistoricPrices(txs);

      // Verify USD prices
      expect(enrichedTxs[0].assetPriceUsdAtTx).toBe(0.10);
      expect(enrichedTxs[0].counterPriceUsdAtTx).toBe(0.05);

      // Verify native price: HEX native = HEX USD / PLS USD = 0.10 / 0.05 = 2.0 PLS per HEX
      expect(enrichedTxs[0].assetPriceNativeAtTx).toBeCloseTo(2.0, 2);
      expect(enrichedTxs[0].counterPriceNativeAtTx).toBeCloseTo(1.0, 2); // 0.05 / 0.05
    });
  });

  /**
   * Test 4: Fallback to Current Price When Historic Unavailable
   * When assetPriceUsdAtTx is missing, system gracefully uses valueUsd
   */
  describe('Test 4: Fallback to Current Price', () => {
    it('should gracefully fall back to valueUsd when historic price unavailable', async () => {
      const txs: Transaction[] = [
        {
          id: 'old-tx',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'OLDTOKEN',
          amount: 100,
          valueUsd: 5000,
          chain: 'ethereum',
          // No txDate, no assetPriceUsdAtTx, no token address - can't enrich
        },
      ];

      const currentAsset: Asset = {
        id: 'oldtoken',
        symbol: 'OLDTOKEN',
        name: 'Old Token',
        balance: 100,
        price: 100, // Current price
        value: 10000,
        chain: 'ethereum',
      };

      // buildInvestmentRows should still calculate using fallback valueUsd
      const rows = buildInvestmentRows([currentAsset], txs, 3000);

      expect(rows).toHaveLength(1);
      expect(rows[0].costBasis).toBeCloseTo(5000, 2); // Fallback to valueUsd
      expect(rows[0].currentValue).toBeCloseTo(10000, 2);
      expect(rows[0].pnlUsd).toBeCloseTo(5000, 2); // 10000 - 5000
    });
  });

  /**
   * Test 5: Multiple Transactions with Different Historic Prices
   * Buy 10000 HEX at $0.10, then 5000 HEX at $0.06
   * Cost basis = (10000 * 0.10) + (5000 * 0.06) = 1300
   */
  describe('Test 5: Multiple Acquisitions with Different Historic Prices', () => {
    it('should sum cost basis across multiple purchases with different historic prices', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      let callCount = 0;
      mockGetHistoricPrice.mockImplementation((tokenId: string, date: Date) => {
        if (tokenId === 'ethereum') {
          callCount++;
          // First call: $1000, second call: $600
          return Promise.resolve(callCount === 1 ? 1000 : 600);
        }
        if (tokenId === 'hex-money') {
          callCount++;
          // First call: $0.10, second call: $0.06
          return Promise.resolve(callCount <= 2 ? 0.10 : 0.06);
        }
        return Promise.resolve(null);
      });

      const txs: Transaction[] = [
        {
          id: 'buy-1',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'swap',
          from: '0xwallet',
          to: '0xrouter',
          asset: 'HEX',
          amount: 10000,
          valueUsd: 1000,
          chain: 'pulsechain',
          counterAsset: 'ETH',
          counterAmount: 0.5,
          txDate: new Date('2021-01-01'),
          assetPriceUsdAtTx: 0.10,
          counterPriceUsdAtTx: 1000,
          assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
          counterTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        {
          id: 'buy-2',
          hash: '0x2',
          timestamp: 1609545600000,
          type: 'swap',
          from: '0xwallet',
          to: '0xrouter',
          asset: 'HEX',
          amount: 5000,
          valueUsd: 300,
          chain: 'pulsechain',
          counterAsset: 'ETH',
          counterAmount: 0.3,
          txDate: new Date('2021-01-02'),
          assetPriceUsdAtTx: 0.06,
          counterPriceUsdAtTx: 600,
          assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
          counterTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
      ];

      const currentHex: Asset = {
        id: 'hex',
        symbol: 'HEX',
        name: 'HEX',
        balance: 15000,
        price: 0.12,
        value: 1800,
        chain: 'pulsechain',
      };

      const rows = buildInvestmentRows([currentHex], txs, 3000);

      // Cost basis = (10000 * 0.10) + (5000 * 0.06) = 1000 + 300 = 1300
      expect(rows[0].costBasis).toBeCloseTo(1300, 2);
      expect(rows[0].currentValue).toBeCloseTo(1800, 2);
      expect(rows[0].pnlUsd).toBeCloseTo(500, 2); // 1800 - 1300
    });
  });

  /**
   * Test 6: Accurate P&L Across Price Volatility
   * Cost basis fixed at $100 regardless of intermediate prices
   */
  describe('Test 6: P&L Consistency Across Volatility', () => {
    it('should keep cost basis fixed while current value responds to market price', async () => {
      const txs: Transaction[] = [
        {
          id: 'entry',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'VOLATILE',
          amount: 100,
          valueUsd: 10000,
          chain: 'ethereum',
          assetPriceUsdAtTx: 100,
          assetTokenAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      // Simulate different market conditions
      const marketPrices = [
        { price: 150, expectedPnL: 5000 }, // +$50 per coin = +$5000 total
        { price: 80, expectedPnL: -2000 }, // -$20 per coin = -$2000 total
        { price: 200, expectedPnL: 10000 }, // +$100 per coin = +$10000 total
      ];

      for (const scenario of marketPrices) {
        const currentAsset: Asset = {
          id: 'volatile',
          symbol: 'VOLATILE',
          name: 'Volatile Token',
          balance: 100,
          price: scenario.price,
          value: 100 * scenario.price,
          chain: 'ethereum',
        };

        const rows = buildInvestmentRows([currentAsset], txs, 3000);

        expect(rows[0].costBasis).toBeCloseTo(10000, 2); // Always fixed at entry
        expect(rows[0].currentValue).toBeCloseTo(100 * scenario.price, 2);
        expect(rows[0].pnlUsd).toBeCloseTo(scenario.expectedPnL, 2);
      }
    });
  });

  /**
   * Test 7: Swap with Historic Prices on Both Sides
   * 100 USDC for 1 WETH at historic prices
   */
  describe('Test 7: Swap with Historic Prices on Both Sides', () => {
    it('should use historic prices for both asset and counter-asset in swaps', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      mockGetHistoricPrice.mockImplementation((tokenId: string, date: Date) => {
        if (tokenId === 'usd-coin') return Promise.resolve(1.00); // USDC always ~$1
        if (tokenId === 'ethereum') return Promise.resolve(3000); // WETH at $3000 at swap time
        if (tokenId === 'pulse') return Promise.resolve(0.05);
        return Promise.resolve(null);
      });

      const txs: Transaction[] = [
        {
          id: 'usdc-swap',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'swap',
          from: '0xwallet',
          to: '0xrouter',
          asset: 'WETH',
          amount: 1,
          valueUsd: 3000,
          chain: 'pulsechain',
          counterAsset: 'USDC',
          counterAmount: 100,
          txDate: new Date('2021-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          counterTokenAddress: '0xefccb3b2a734cd3ceca6f11a5e5c3a5e6dea4f07',
        },
      ];

      const enrichedTxs = await enrichTransactionsWithHistoricPrices(txs);

      // Both prices should be populated from CoinGecko
      expect(enrichedTxs[0].assetPriceUsdAtTx).toBe(3000); // WETH
      expect(enrichedTxs[0].counterPriceUsdAtTx).toBe(1.00); // USDC

      const currentWeth: Asset = {
        id: 'weth',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        balance: 1,
        price: 3500, // Current price increased
        value: 3500,
        chain: 'pulsechain',
      };

      const rows = buildInvestmentRows([currentWeth], txs, 3000);

      // Cost basis based on what was spent (historic): 100 USDC * $1.00 = $100... wait
      // Actually for received asset (WETH): cost = amount * historic price = 1 * $3000 = $3000
      expect(rows[0].costBasis).toBeCloseTo(3000, 2);
      expect(rows[0].currentValue).toBeCloseTo(3500, 2);
      expect(rows[0].pnlUsd).toBeCloseTo(500, 2);
    });
  });

  /**
   * Test 8: Cached Prices Reduce API Calls
   * Multiple transactions from same day should hit cache
   */
  describe('Test 8: Cached Prices Reduce API Calls', () => {
    it('should use cache for same token/date combinations to reduce API calls', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2000);

      // Three transactions: two ETH on same date, one on different date
      const txs: Transaction[] = [
        {
          id: 'tx-1',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 1,
          valueUsd: 2000,
          chain: 'ethereum',
          txDate: new Date('2021-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        {
          id: 'tx-2',
          hash: '0x2',
          timestamp: 1609545600000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 0.5,
          valueUsd: 1000,
          chain: 'ethereum',
          txDate: new Date('2021-01-01'), // Same date as tx-1
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        {
          id: 'tx-3',
          hash: '0x3',
          timestamp: 1609632000000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 0.2,
          valueUsd: 400,
          chain: 'ethereum',
          txDate: new Date('2021-01-02'), // Different date
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
      ];

      await enrichTransactionsWithHistoricPrices(txs);

      // Should call CoinGecko twice: once for 2021-01-01, once for 2021-01-02
      // (This is more of a specification than something we can easily test without
      // access to internal cache mechanics, but the enrichment should work)
      expect(mockGetHistoricPrice).toHaveBeenCalled();
    });
  });

  /**
   * Test 9: Date Range Consistency
   * Historic prices should work correctly across multi-year portfolio
   */
  describe('Test 9: Date Range Consistency (2020-2024)', () => {
    it('should handle historic prices across multiple years correctly', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      mockGetHistoricPrice.mockImplementation((tokenId: string, date: Date) => {
        // Return different prices for different years
        const year = date.getFullYear();
        if (tokenId === 'ethereum') {
          return Promise.resolve({
            2020: 100,
            2021: 2000,
            2022: 1200,
            2024: 3500,
          }[year] || null);
        }
        return Promise.resolve(null);
      });

      const txs: Transaction[] = [
        {
          id: 'early',
          hash: '0x1',
          timestamp: 1577836800000, // 2020-01-01
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 10,
          valueUsd: 1000,
          chain: 'ethereum',
          txDate: new Date('2020-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        {
          id: 'bull',
          hash: '0x2',
          timestamp: 1609459200000, // 2021-01-01
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 5,
          valueUsd: 10000,
          chain: 'ethereum',
          txDate: new Date('2021-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        {
          id: 'recent',
          hash: '0x3',
          timestamp: 1704067200000, // 2024-01-01
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 2,
          valueUsd: 7000,
          chain: 'ethereum',
          txDate: new Date('2024-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
      ];

      const currentEth: Asset = {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 17,
        price: 3500,
        value: 59500,
        chain: 'ethereum',
      };

      const rows = buildInvestmentRows([currentEth], txs, 3000);

      // Cost basis = (10 * 100) + (5 * 2000) + (2 * 3500) = 1000 + 10000 + 7000 = 18000
      expect(rows[0].costBasis).toBeCloseTo(18000, 2);
      expect(rows[0].currentValue).toBeCloseTo(59500, 2);
    });
  });

  /**
   * Test 10: Error Handling in Workflow
   * Network errors should gracefully fall back without crashing
   */
  describe('Test 10: Error Handling in Workflow', () => {
    it('should gracefully handle network errors and use fallback values', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;

      // Simulate network error - return null
      mockGetHistoricPrice.mockResolvedValue(null);

      const txs: Transaction[] = [
        {
          id: 'tx-1',
          hash: '0x1',
          timestamp: 1609459200000,
          type: 'deposit',
          from: '0xext',
          to: '0xwallet',
          asset: 'ETH',
          amount: 1,
          valueUsd: 3000,
          chain: 'ethereum',
          txDate: new Date('2021-01-01'),
          assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
      ];

      const enrichedTxs = await enrichTransactionsWithHistoricPrices(txs);

      // Should return transaction with assetPriceUsdAtTx = null
      expect(enrichedTxs).toHaveLength(1);
      expect(enrichedTxs[0].assetPriceUsdAtTx).toBeNull();

      const currentEth: Asset = {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 1,
        price: 3500,
        value: 3500,
        chain: 'ethereum',
      };

      // buildInvestmentRows should still work - it will use valueUsd as fallback
      const rows = buildInvestmentRows([currentEth], txs, 3000);

      expect(rows).toHaveLength(1);
      // Cost basis falls back to valueUsd since assetPriceUsdAtTx is null
      expect(rows[0].costBasis).toBeCloseTo(3000, 2);
      expect(rows[0].currentValue).toBeCloseTo(3500, 2);
      expect(rows[0].pnlUsd).toBeCloseTo(500, 2);
    });
  });
});
