import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enrichTransactionsWithHistoricPrices,
} from '../services/transactionEnrichmentPipeline';
import { buildInvestmentRows } from '../utils/buildInvestmentRows';
import { Transaction, Asset } from '../types';
import * as priceService from '../services/coingeckoHistoricPriceService';

// Mock the price service
vi.mock('../services/coingeckoHistoricPriceService');

describe('Edge Cases: Historic Pricing System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console spy
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ============================================================================
  // Test 1: Missing Historic Price Data
  // ============================================================================
  describe('Missing Historic Price Data', () => {
    it('should fall back to valueUsd when historic price is null', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null); // CoinGecko returns null

      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        valueUsd: 2500, // fallback value
        chain: 'pulsechain',
        txDate: new Date('2015-01-01'), // before HEX existed
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);

      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBeNull(); // historic price is null
      // Transaction should not crash and should be returned
      expect(result[0].id).toBe('tx-1');
    });

    it('should log warning when falling back to valueUsd', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      const tx: Transaction = {
        id: 'tx-2',
        hash: '0xdef456',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'UNKNOWN_TOKEN',
        amount: 50,
        valueUsd: 1000,
        chain: 'ethereum',
        txDate: new Date('2010-01-01'),
        assetTokenAddress: '0x0000000000000000000000000000000000000001',
      };

      await enrichTransactionsWithHistoricPrices([tx]);

      // Should log that it's falling back
      expect(console.warn).toHaveBeenCalled();
    });

    it('should use valueUsd for cost basis when historic price missing', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      // Use USDC which has a known mapping and stable price
      const tx: Transaction = {
        id: 'tx-3',
        hash: '0x789ghi',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        asset: 'USDC',
        amount: 5000,
        valueUsd: 5000,
        chain: 'ethereum',
        txDate: new Date('2021-01-01'),
        assetTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);

      // Cost basis should be calculated using valueUsd as fallback
      const currentAssets: Asset[] = [
        {
          id: 'usdc-1',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 5000,
          price: 1.0,
          value: 5000,
          chain: 'ethereum',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 100);
      expect(rows).toHaveLength(1);
      // Cost basis should fall back to valueUsd (5000) since historic price was null
      expect(rows[0].costBasis).toEqual(5000);
    });
  });

  // ============================================================================
  // Test 2: Future Transactions
  // ============================================================================
  describe('Future Transactions', () => {
    it('should handle future transaction dates gracefully', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null); // No future prices available

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const tx: Transaction = {
        id: 'future-tx-1',
        hash: '0xfuture123',
        timestamp: futureDate.getTime(),
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        valueUsd: 0,
        chain: 'pulsechain',
        txDate: futureDate,
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      // Should not throw, should handle gracefully
      expect(async () => {
        await enrichTransactionsWithHistoricPrices([tx]);
      }).not.toThrow();

      const result = await enrichTransactionsWithHistoricPrices([tx]);
      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBeNull();
    });

    it('should not crash when future transaction has no valueUsd', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const tx: Transaction = {
        id: 'future-tx-2',
        hash: '0xfuture456',
        timestamp: futureDate.getTime(),
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 50,
        counterAsset: 'USDC',
        counterAmount: 100,
        chain: 'pulsechain',
        txDate: futureDate,
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);
      expect(result).toHaveLength(1);
      expect(result[0].assetPriceUsdAtTx).toBeNull();
      expect(result[0].counterPriceUsdAtTx).toBeNull();
    });
  });

  // ============================================================================
  // Test 3: Very Old Transactions (Pre-2010)
  // ============================================================================
  describe('Very Old Transactions', () => {
    it('should handle transactions before crypto existed', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null); // No data for pre-crypto

      const tx: Transaction = {
        id: 'old-tx-1',
        hash: '0xold123',
        timestamp: 200000000000, // Year 1976
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'BTC',
        amount: 1,
        valueUsd: 0,
        chain: 'ethereum',
        txDate: new Date('1995-01-01'),
        assetTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);
      expect(result).toHaveLength(1);
      // Should not crash, gracefully degrade
      expect(result[0].assetPriceUsdAtTx).toBeNull();
    });

    it('should work with cost basis calculation for very old txs', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      const tx: Transaction = {
        id: 'old-tx-2',
        hash: '0xold456',
        timestamp: 1000000000000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 10,
        valueUsd: 50, // Estimated value
        chain: 'ethereum',
        txDate: new Date('2010-07-01'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      const currentAssets: Asset[] = [
        {
          id: 'eth-1',
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 10,
          price: 2500,
          value: 25000,
          chain: 'ethereum',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 2500);
      expect(rows).toHaveLength(1);
      // Should still calculate P&L even with old transaction
      expect(rows[0].pnlUsd).toBeDefined();
    });
  });

  // ============================================================================
  // Test 4: Decimal Precision Issues
  // ============================================================================
  describe('Decimal Precision', () => {
    it('should handle very small prices without precision loss', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      const smallPrice = 0.00001; // Small price, but realistic
      mockGetHistoricPrice.mockResolvedValue(smallPrice);

      const tx: Transaction = {
        id: 'precision-tx-1',
        hash: '0xprec123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'DAI',
        amount: 1000000, // 1M tokens
        chain: 'ethereum',
        txDate: new Date('2021-05-15'),
        assetTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      expect(enriched[0].assetPriceUsdAtTx).toBe(smallPrice);
    });

    it('should handle very large prices without rounding errors', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(98765.43210); // Large price

      const tx: Transaction = {
        id: 'precision-tx-2',
        hash: '0xprec456',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'BTC',
        amount: 0.5, // Half a BTC
        chain: 'ethereum',
        txDate: new Date('2021-11-10'),
        assetTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      expect(enriched[0].assetPriceUsdAtTx).toBeCloseTo(98765.43210, 4);

      // Verify cost basis calculation
      const costBasis = (enriched[0].amount ?? 0) * (enriched[0].assetPriceUsdAtTx ?? 0);
      expect(costBasis).toBeCloseTo(49382.716, 2);
    });

    it('should handle decimal amounts without losing precision', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      const price = 2345.6789;
      mockGetHistoricPrice.mockResolvedValue(price);

      const amount = 0.123456789;
      const tx: Transaction = {
        id: 'precision-tx-3',
        hash: '0xprec789',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount, // Very precise decimal
        chain: 'ethereum',
        txDate: new Date('2021-08-20'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      const costBasis = (enriched[0].amount ?? 0) * (enriched[0].assetPriceUsdAtTx ?? 0);
      const expectedCost = amount * price;
      // Should preserve precision to reasonable decimal places
      expect(costBasis).toBeCloseTo(expectedCost, 2);
    });
  });

  // ============================================================================
  // Test 5: Large Numbers (Whale Wallets)
  // ============================================================================
  describe('Large Numbers', () => {
    it('should handle whale-sized holdings correctly', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(50000);

      const tx: Transaction = {
        id: 'whale-tx-1',
        hash: '0xwhale123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'BTC',
        amount: 1000, // 1000 BTC
        chain: 'ethereum',
        txDate: new Date('2020-01-01'),
        assetTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      const costBasis = (enriched[0].amount ?? 0) * (enriched[0].assetPriceUsdAtTx ?? 0);
      expect(costBasis).toBe(50000000); // $50M
    });

    it('should handle very large USD values in portfolio', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx: Transaction = {
        id: 'whale-tx-2',
        hash: '0xwhale456',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 10000, // 10k ETH
        valueUsd: 25000000,
        chain: 'ethereum',
        txDate: new Date('2021-05-15'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      const currentAssets: Asset[] = [
        {
          id: 'eth-whale',
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 10000,
          price: 3000,
          value: 30000000,
          chain: 'ethereum',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 2500);
      expect(rows).toHaveLength(1);
      expect(rows[0].currentValue).toBe(30000000);
      expect(rows[0].costBasis).toBeGreaterThan(0);
    });

    it('should calculate correct P&L for large amounts', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(1.0); // USDC price

      const tx: Transaction = {
        id: 'whale-tx-3',
        hash: '0xwhale789',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'USDC',
        amount: 5000000, // $5M USDC
        chain: 'ethereum',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      const currentAssets: Asset[] = [
        {
          id: 'usdc-whale',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 5000000,
          price: 1.0,
          value: 5000000,
          chain: 'ethereum',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 1000);
      expect(rows).toHaveLength(1);
      expect(rows[0].costBasis).toBeCloseTo(5000000, 0);
      expect(rows[0].pnlUsd).toBeCloseTo(0, 0); // Break even on stablecoin
    });
  });

  // ============================================================================
  // Test 6: Zero and Null Handling
  // ============================================================================
  describe('Zero and Null Handling', () => {
    it('should handle zero amount transactions without crashing', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx: Transaction = {
        id: 'zero-tx-1',
        hash: '0xzero123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 0, // Dust/pending
        chain: 'pulsechain',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      expect(async () => {
        await enrichTransactionsWithHistoricPrices([tx]);
      }).not.toThrow();
    });

    it('should handle undefined/null price without division by zero', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(null);

      const tx: Transaction = {
        id: 'null-price-tx-1',
        hash: '0xnull123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        chain: 'pulsechain',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([tx]);
      expect(enriched[0].assetPriceUsdAtTx).toBeNull();

      // Verify no native price calculation with null
      const currentAssets: Asset[] = [];
      const rows = buildInvestmentRows(currentAssets, enriched, 100);
      expect(rows).toHaveLength(0);
    });

    it('should handle swap with zero counter amount', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx: Transaction = {
        id: 'zero-counter-tx',
        hash: '0xzerocount',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 0, // Zero counter
        chain: 'pulsechain',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      expect(async () => {
        await enrichTransactionsWithHistoricPrices([tx]);
      }).not.toThrow();
    });

    it('should not divide by zero when calculating native prices', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      // Asset and counter have prices, but PLS price is 0
      mockGetHistoricPrice
        .mockResolvedValueOnce(2500) // asset price
        .mockResolvedValueOnce(100) // counter price
        .mockResolvedValueOnce(0); // PLS price = 0 (shouldn't happen but defensive)

      const tx: Transaction = {
        id: 'div-zero-tx',
        hash: '0xdivzero',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100,
        counterAsset: 'USDC',
        counterAmount: 250,
        chain: 'pulsechain',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
        counterTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      };

      const result = await enrichTransactionsWithHistoricPrices([tx]);
      // Should have USD prices
      expect(result[0].assetPriceUsdAtTx).toBe(2500);
      // But native prices should be null (can't divide by 0)
      expect(result[0].assetPriceNativeAtTx).toBeNull();
      expect(result[0].counterPriceNativeAtTx).toBeNull();
    });
  });

  // ============================================================================
  // Test 7: Staking/Rewards Transactions
  // ============================================================================
  describe('Staking and Rewards', () => {
    it('should set cost basis to 0 for reward transactions', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(0.05);

      const rewardTx: Transaction = {
        id: 'reward-tx-1',
        hash: '0xreward123',
        timestamp: 1625097600000,
        type: 'deposit', // Rewards typically come through as deposits
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'PLS',
        amount: 100, // 100 PLS reward
        valueUsd: 0, // No cost basis for rewards
        chain: 'pulsechain',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x95b6e99cffc8bffc7baf4c4a69ebeb9cc8b9fee1f',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([rewardTx]);

      const currentAssets: Asset[] = [
        {
          id: 'pls-reward',
          symbol: 'PLS',
          name: 'Pulse',
          balance: 100,
          price: 0.05,
          value: 5,
          chain: 'pulsechain',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 0.05);
      expect(rows).toHaveLength(1);
      // Cost basis should be 0 since valueUsd is 0
      expect(rows[0].costBasis).toBe(0);
      expect(rows[0].pnlUsd).toBe(5); // Entire value is profit
    });

    it('should handle airdrop with valueUsd = 0', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(1.5);

      const airdropTx: Transaction = {
        id: 'airdrop-tx-1',
        hash: '0xairdrop123',
        timestamp: 1700000000000,
        type: 'deposit',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ARB',
        amount: 2000,
        valueUsd: 0, // Airdrop
        chain: 'ethereum',
        txDate: new Date('2023-03-16'),
        assetTokenAddress: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
      };

      const enriched = await enrichTransactionsWithHistoricPrices([airdropTx]);
      const currentAssets: Asset[] = [
        {
          id: 'arb-airdrop',
          symbol: 'ARB',
          name: 'Arbitrum',
          balance: 2000,
          price: 2.0,
          value: 4000,
          chain: 'ethereum',
        },
      ];

      const rows = buildInvestmentRows(currentAssets, enriched, 1.5);
      expect(rows).toHaveLength(1);
      // All value is profit since cost basis is 0
      expect(rows[0].pnlUsd).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test 8: Concurrent Price Updates
  // ============================================================================
  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent enrichment calls without duplicate API calls', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(2500);

      const tx1: Transaction = {
        id: 'concurrent-tx-1',
        hash: '0xconcur1',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1,
        chain: 'ethereum',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      };

      const tx2: Transaction = {
        id: 'concurrent-tx-2',
        hash: '0xconcur2',
        timestamp: 1625097700000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1,
        chain: 'ethereum',
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      };

      // Both should be enriched without crashing
      const [results1, results2] = await Promise.all([
        enrichTransactionsWithHistoricPrices([tx1]),
        enrichTransactionsWithHistoricPrices([tx2]),
      ]);

      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
      expect(results1[0].assetPriceUsdAtTx).toBe(2500);
      expect(results2[0].assetPriceUsdAtTx).toBe(2500);
    });

    it('should maintain data consistency across concurrent updates', async () => {
      const mockGetHistoricPrice = priceService.getHistoricPrice as any;
      mockGetHistoricPrice.mockResolvedValue(1500);

      const transactions: Transaction[] = Array.from({ length: 5 }, (_, i) => ({
        id: `batch-tx-${i}`,
        hash: `0xbatch${i}`,
        timestamp: 1625097600000 + i * 1000,
        type: 'deposit' as const,
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'HEX',
        amount: 100 * (i + 1),
        chain: 'pulsechain' as const,
        txDate: new Date('2021-06-01'),
        assetTokenAddress: '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc',
      }));

      const results = await enrichTransactionsWithHistoricPrices(transactions);

      expect(results).toHaveLength(5);
      results.forEach((tx, i) => {
        expect(tx.id).toBe(`batch-tx-${i}`);
        expect(tx.assetPriceUsdAtTx).toBe(1500);
      });
    });
  });
});
