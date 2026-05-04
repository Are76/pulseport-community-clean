import { describe, it, expect } from 'vitest';
import { Transaction, TransactionType, Chain } from '../types';

describe('Transaction interface', () => {
  describe('interface structure', () => {
    it('should allow creating a minimal transaction', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit' as TransactionType,
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        chain: 'pulsechain' as Chain,
      };

      expect(tx).toBeDefined();
      expect(tx.id).toBe('tx-1');
      expect(tx.asset).toBe('ETH');
    });

    it('should allow creating a swap transaction with counter asset fields', () => {
      const tx: Transaction = {
        id: 'tx-swap-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
      };

      expect(tx.counterAsset).toBe('USDC');
      expect(tx.counterAmount).toBe(3000);
    });

    it('should allow optional historic price fields', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
        assetPriceUsdAtTx: 2500.75,
        counterPriceUsdAtTx: 1.0,
      };

      expect(tx.assetPriceUsdAtTx).toBe(2500.75);
      expect(tx.counterPriceUsdAtTx).toBe(1.0);
    });

    it('should allow native price fields', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
        assetPriceNativeAtTx: 15.5,
        counterPriceNativeAtTx: 0.01,
      };

      expect(tx.assetPriceNativeAtTx).toBe(15.5);
      expect(tx.counterPriceNativeAtTx).toBe(0.01);
    });

    it('should allow all historic price fields together', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
        assetPriceUsdAtTx: 2500.75,
        counterPriceUsdAtTx: 1.0,
        assetPriceNativeAtTx: 15.5,
        counterPriceNativeAtTx: 0.01,
      };

      expect(tx.assetPriceUsdAtTx).toBe(2500.75);
      expect(tx.counterPriceUsdAtTx).toBe(1.0);
      expect(tx.assetPriceNativeAtTx).toBe(15.5);
      expect(tx.counterPriceNativeAtTx).toBe(0.01);
    });

    it('should allow txDate for historic price lookup', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
        txDate: new Date('2021-07-01'),
      };

      expect(tx.txDate).toEqual(new Date('2021-07-01'));
    });
  });

  describe('backward compatibility', () => {
    it('should create transaction without historic price fields', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        chain: 'pulsechain',
      };

      expect(tx.assetPriceUsdAtTx).toBeUndefined();
      expect(tx.counterPriceUsdAtTx).toBeUndefined();
      expect(tx.assetPriceNativeAtTx).toBeUndefined();
      expect(tx.counterPriceNativeAtTx).toBeUndefined();
      expect(tx.txDate).toBeUndefined();
    });

    it('should support partial historic price fields', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
        assetPriceUsdAtTx: 2500.75,
      };

      expect(tx.assetPriceUsdAtTx).toBe(2500.75);
      expect(tx.counterPriceUsdAtTx).toBeUndefined();
      expect(tx.assetPriceNativeAtTx).toBeUndefined();
    });

    it('should preserve existing optional fields', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'deposit',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        chain: 'pulsechain',
        valueUsd: 3750.5,
        fee: 0.01,
        status: 'confirmed',
      };

      expect(tx.valueUsd).toBe(3750.5);
      expect(tx.fee).toBe(0.01);
      expect(tx.status).toBe('confirmed');
    });

    it('should support all transaction types', () => {
      const types: TransactionType[] = ['deposit', 'withdraw', 'swap'];

      types.forEach((type) => {
        const tx: Transaction = {
          id: `tx-${type}`,
          hash: '0xabc123',
          timestamp: 1625097600000,
          type,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          asset: 'ETH',
          amount: 1.5,
          chain: 'pulsechain',
        };

        expect(tx.type).toBe(type);
      });
    });

    it('should support all chain types', () => {
      const chains: Chain[] = ['pulsechain', 'ethereum', 'base'];

      chains.forEach((chain) => {
        const tx: Transaction = {
          id: 'tx-1',
          hash: '0xabc123',
          timestamp: 1625097600000,
          type: 'deposit',
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          asset: 'ETH',
          amount: 1.5,
          chain,
        };

        expect(tx.chain).toBe(chain);
      });
    });
  });

  describe('historic price field semantics', () => {
    it('assetPriceUsdAtTx should represent asset price in USD at tx time', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.0,
        counterAsset: 'USDC',
        counterAmount: 2500,
        chain: 'pulsechain',
        assetPriceUsdAtTx: 2500.0,
      };

      // At tx time, 1 ETH was worth 2500 USD
      expect(tx.amount * tx.assetPriceUsdAtTx!).toBe(2500.0);
    });

    it('counterPriceUsdAtTx should represent counter asset price in USD at tx time', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.0,
        counterAsset: 'USDC',
        counterAmount: 2500,
        chain: 'pulsechain',
        counterPriceUsdAtTx: 1.0,
      };

      // At tx time, 1 USDC was worth 1 USD
      expect(tx.counterAmount * tx.counterPriceUsdAtTx!).toBeCloseTo(2500.0);
    });

    it('native prices should allow calculating PLS value at tx time', () => {
      const tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.0,
        counterAsset: 'USDC',
        counterAmount: 2500,
        chain: 'pulsechain',
        assetPriceNativeAtTx: 10.0, // 1 ETH = 10 PLS
        counterPriceNativeAtTx: 0.004, // 1 USDC = 0.004 PLS
      };

      // Can calculate PLS value at tx time
      const ethValueInPls = tx.amount * tx.assetPriceNativeAtTx!;
      const usdcValueInPls = tx.counterAmount * tx.counterPriceNativeAtTx!;

      expect(ethValueInPls).toBe(10.0);
      expect(usdcValueInPls).toBe(10.0);
    });
  });

  describe('enrichment scenario', () => {
    it('should allow enriching a basic transaction with historic prices', () => {
      // Start with basic transaction
      let tx: Transaction = {
        id: 'tx-1',
        hash: '0xabc123',
        timestamp: 1625097600000,
        type: 'swap',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        asset: 'ETH',
        amount: 1.5,
        counterAsset: 'USDC',
        counterAmount: 3000,
        chain: 'pulsechain',
      };

      // Enrich with prices from service
      tx = {
        ...tx,
        assetPriceUsdAtTx: 2500.75,
        counterPriceUsdAtTx: 1.0,
        assetPriceNativeAtTx: 15.5,
        counterPriceNativeAtTx: 0.01,
        txDate: new Date('2021-07-01'),
      };

      expect(tx.assetPriceUsdAtTx).toBe(2500.75);
      expect(tx.counterPriceUsdAtTx).toBe(1.0);
      expect(tx.assetPriceNativeAtTx).toBe(15.5);
      expect(tx.counterPriceNativeAtTx).toBe(0.01);
      expect(tx.txDate).toEqual(new Date('2021-07-01'));
    });
  });
});
