import { describe, expect, it } from 'vitest';
import type { Asset, Transaction } from '../types';
import { buildInvestmentRows } from '../utils/buildInvestmentRows';

const currentHex: Asset = {
  id: 'hex',
  symbol: 'HEX',
  name: 'HEX',
  balance: 10000,
  price: 0.12,
  value: 1200,
  chain: 'pulsechain',
};

describe('buildInvestmentRows', () => {
  it('carries ETH source cost through bridge and swap into PulseChain holdings', () => {
    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 0.5,
        valueUsd: 1000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 0.5,
        valueUsd: 1000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'hex-buy',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        valueUsd: 1000,
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 0.5,
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    expect(rows).toHaveLength(1);
    expect(rows[0].costBasis).toBeCloseTo(1000, 4);
    expect(rows[0].sourceMix).toEqual([
      { asset: 'ETH', chain: 'ethereum', amountUsd: 1000 },
    ]);
    expect(rows[0].routeSummary).toContain('WETH -> HEX');
  });

  it('maps bridged DAI on PulseChain to pDAI holdings without double-counting cost', () => {
    const currentPDai: Asset = {
      id: 'pdai',
      symbol: 'pDAI',
      name: 'DAI (from Ethereum)',
      balance: 500,
      price: 1,
      value: 500,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'dai-in',
        hash: '0xa',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'DAI',
        amount: 500,
        valueUsd: 500,
        chain: 'ethereum',
      },
      {
        id: 'pdai-in',
        hash: '0xb',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'DAI (from Ethereum)',
        amount: 500,
        valueUsd: 500,
        chain: 'pulsechain',
        bridged: true,
      },
    ];

    const rows = buildInvestmentRows([currentPDai], txs, 2000);

    expect(rows[0].costBasis).toBeCloseTo(500, 4);
    expect(rows[0].sourceMix[0]).toEqual({ asset: 'DAI', chain: 'ethereum', amountUsd: 500 });
  });

  it('maps PulseChain fork-copy stable swap outputs into p-token holdings', () => {
    const currentPDai: Asset = {
      id: 'pdai',
      symbol: 'pDAI',
      name: 'DAI (System Copy)',
      balance: 40000,
      price: 0.0018,
      value: 72,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0xc1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 2000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0xc2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 2000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'pdai-buy',
        hash: '0xc3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'DAI (FORK COPY)',
        amount: 40000,
        valueUsd: 2000,
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
      },
    ];

    const rows = buildInvestmentRows([currentPDai], txs, 2000);

    expect(rows).toHaveLength(1);
    expect(rows[0].costBasis).toBeCloseTo(2000, 4);
    expect(rows[0].sourceMix).toEqual([
      { asset: 'ETH', chain: 'ethereum', amountUsd: 2000 },
    ]);
  });

  it('ignores PulseChain-only deposits as funding sources when no Ethereum/Base inflow exists', () => {
    const currentPls: Asset = {
      id: 'pls',
      symbol: 'PLS',
      name: 'PulseChain',
      balance: 100000,
      price: 0.00008,
      value: 8,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'pulse-airdrop',
        hash: '0xair',
        timestamp: 1,
        type: 'deposit',
        from: '0xexternal',
        to: '0xme',
        asset: 'PLS',
        amount: 100000,
        valueUsd: 8,
        chain: 'pulsechain',
      },
    ];

    const rows = buildInvestmentRows([currentPls], txs, 2000);

    expect(rows).toHaveLength(1);
    expect(rows[0].costBasis).toBe(0);
    expect(rows[0].sourceMix).toEqual([]);
  });

  it('uses historic price (assetPriceUsdAtTx) for cost basis instead of current price', () => {
    const currentHex: Asset = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      balance: 10000,
      price: 0.20, // Current price is $0.20
      value: 2000,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000, // Historic ETH price at tx time
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'hex-swap',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        assetPriceUsdAtTx: 0.20, // Historic HEX price at swap time
        valueUsd: 2000,
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
        counterPriceUsdAtTx: 2000,
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    // Cost basis = amount * assetPriceUsdAtTx from swap = 10000 * 0.20 = 2000
    expect(rows[0].costBasis).toBeCloseTo(2000, 2);
    expect(rows[0].pnlUsd).toBeCloseTo(2000 - 2000, 2); // currentValue - costBasis = 0
  });

  it('falls back to valueUsd when assetPriceUsdAtTx is missing', () => {
    const currentHex: Asset = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      balance: 10000,
      price: 0.20,
      value: 2000,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'hex-swap',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        valueUsd: 2000, // Fallback value (no assetPriceUsdAtTx)
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
        counterPriceUsdAtTx: 2000,
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    // Should fall back to valueUsd: 2000
    expect(rows[0].costBasis).toBeCloseTo(2000, 2);
  });

  it('calculates cost basis correctly for swaps using assetPriceUsdAtTx', () => {
    const currentHex: Asset = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      balance: 10000,
      price: 0.10,
      value: 1000,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000, // Historic ETH price
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 2000,
        assetPriceUsdAtTx: 2000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'hex-swap',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        assetPriceUsdAtTx: 0.20, // Historic HEX price at swap time
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
        counterPriceUsdAtTx: 2000,
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    // Cost basis should use ETH's historic cost (2000 USD), not HEX's entry price
    // The WETH brought in 2000 USD worth, so HEX cost basis = 2000
    expect(rows[0].costBasis).toBeCloseTo(2000, 2);
  });

  it('ignores withdraw transactions in cost basis calculation', () => {
    const currentHex: Asset = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      balance: 5000,
      price: 0.10,
      value: 500,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 1000,
        assetPriceUsdAtTx: 1000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 1000,
        assetPriceUsdAtTx: 1000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'hex-swap',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        assetPriceUsdAtTx: 0.10,
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
        counterPriceUsdAtTx: 1000,
      },
      {
        id: 'hex-sell',
        hash: '0x4',
        timestamp: 4,
        type: 'withdraw',
        from: '0xme',
        to: '0xext',
        asset: 'HEX',
        amount: 5000,
        valueUsd: 500,
        chain: 'pulsechain',
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    // Cost basis should only count the swap: 10000 * 0.10 = 1000
    // Withdraw removes from position but doesn't affect cost basis calculation
    // Remaining 5000 HEX has cost basis proportional to original: (5000/10000) * 1000 = 500
    expect(rows[0].costBasis).toBeCloseTo(500, 2);
  });

  it('handles multiple acquisitions with different historic prices', () => {
    const currentHex: Asset = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      balance: 15000,
      price: 0.12,
      value: 1800,
      chain: 'pulsechain',
    };

    const txs: Transaction[] = [
      {
        id: 'eth-in',
        hash: '0x1',
        timestamp: 1,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 1,
        valueUsd: 1000,
        assetPriceUsdAtTx: 1000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in',
        hash: '0x2',
        timestamp: 2,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 1,
        valueUsd: 1000,
        assetPriceUsdAtTx: 1000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'buy-1',
        hash: '0x3',
        timestamp: 3,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 10000,
        assetPriceUsdAtTx: 0.10, // First purchase at $0.10
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 1,
        counterPriceUsdAtTx: 1000,
      },
      {
        id: 'eth-in-2',
        hash: '0x4',
        timestamp: 4,
        type: 'deposit',
        from: '0xext',
        to: '0xme',
        asset: 'ETH',
        amount: 0.3,
        valueUsd: 300,
        assetPriceUsdAtTx: 1000,
        chain: 'ethereum',
      },
      {
        id: 'bridge-in-2',
        hash: '0x5',
        timestamp: 5,
        type: 'deposit',
        from: '0xbridge',
        to: '0xme',
        asset: 'WETH (from Ethereum)',
        amount: 0.3,
        valueUsd: 300,
        assetPriceUsdAtTx: 1000,
        chain: 'pulsechain',
        bridged: true,
      },
      {
        id: 'buy-2',
        hash: '0x6',
        timestamp: 6,
        type: 'swap',
        from: '0xme',
        to: '0xrouter',
        asset: 'HEX',
        amount: 5000,
        assetPriceUsdAtTx: 0.06, // Second purchase at $0.06
        chain: 'pulsechain',
        counterAsset: 'WETH (from Ethereum)',
        counterAmount: 0.3,
        counterPriceUsdAtTx: 1000,
      },
    ];

    const rows = buildInvestmentRows([currentHex], txs, 2000);

    // Cost basis = (10000 * 0.10) + (5000 * 0.06) = 1000 + 300 = 1300
    expect(rows[0].costBasis).toBeCloseTo(1300, 2);
  });
});
