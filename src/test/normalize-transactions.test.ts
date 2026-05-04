import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Transaction } from '../types';
import { normalizeTransactions } from '../utils/normalizeTransactions';
import * as enrichmentPipeline from '../services/transactionEnrichmentPipeline';

describe('normalizeTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not collapse same-asset in/out transfers into swaps', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();

    const txs: Transaction[] = [
      {
        id: 'inc-out',
        hash: '0xinc',
        timestamp,
        type: 'withdraw',
        from: '0xwallet',
        to: '0xother',
        asset: 'INC',
        amount: 100,
        valueUsd: 250,
        chain: 'pulsechain',
      },
      {
        id: 'inc-in',
        hash: '0xinc',
        timestamp,
        type: 'deposit',
        from: '0xrouter',
        to: '0xwallet',
        asset: 'INC',
        amount: 99.5,
        valueUsd: 248.75,
        chain: 'pulsechain',
      },
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(txs);

    const normalized = await normalizeTransactions(txs, walletAddrs);

    expect(normalized).toHaveLength(2);
    expect(normalized.every(tx => tx.type !== 'swap')).toBe(true);
    expect(normalized.map(tx => tx.id).sort()).toEqual(['inc-in', 'inc-out']);
  });

  it('still collapses different-asset in/out pairs into swaps', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();

    const txs: Transaction[] = [
      {
        id: 'pls-out',
        hash: '0xswap',
        timestamp,
        type: 'withdraw',
        from: '0xwallet',
        to: '0xrouter',
        asset: 'PLS',
        amount: 1000,
        valueUsd: 82,
        chain: 'pulsechain',
      },
      {
        id: 'inc-in',
        hash: '0xswap',
        timestamp,
        type: 'deposit',
        from: '0xrouter',
        to: '0xwallet',
        asset: 'INC',
        amount: 32.1,
        valueUsd: 82,
        chain: 'pulsechain',
      },
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(txs);

    const normalized = await normalizeTransactions(txs, walletAddrs);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      type: 'swap',
      asset: 'INC',
      counterAsset: 'PLS',
      counterAmount: 1000,
    });
  });

  it('calls enrichTransactionsWithHistoricPrices before normalization', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        hash: '0xtx1',
        timestamp,
        type: 'deposit',
        from: '0xother',
        to: '0xwallet',
        asset: 'HEX',
        amount: 100,
        chain: 'pulsechain',
      },
    ];

    const enrichSpy = vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(txs);

    await normalizeTransactions(txs, walletAddrs);

    expect(enrichSpy).toHaveBeenCalledWith(txs);
    expect(enrichSpy).toHaveBeenCalledOnce();
  });

  it('uses enriched transactions with historic prices for swap cost basis', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();

    const rawTxs: Transaction[] = [
      {
        id: 'pls-out',
        hash: '0xswap',
        timestamp,
        type: 'withdraw',
        from: '0xwallet',
        to: '0xrouter',
        asset: 'PLS',
        amount: 1000,
        valueUsd: 82,
        chain: 'pulsechain',
        assetPriceUsdAtTx: undefined, // Not set yet
      },
      {
        id: 'hex-in',
        hash: '0xswap',
        timestamp,
        type: 'deposit',
        from: '0xrouter',
        to: '0xwallet',
        asset: 'HEX',
        amount: 5000,
        valueUsd: 82,
        chain: 'pulsechain',
        assetPriceUsdAtTx: undefined, // Not set yet
      },
    ];

    // Enriched versions with historic prices
    const enrichedTxs: Transaction[] = [
      { ...rawTxs[0], counterPriceUsdAtTx: 0.082 }, // PLS was 0.082 at tx time
      { ...rawTxs[1], assetPriceUsdAtTx: 0.0164 }, // HEX was 0.0164 at tx time
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(enrichedTxs);

    const normalized = await normalizeTransactions(rawTxs, walletAddrs);

    expect(normalized).toHaveLength(1);
    const swap = normalized[0];
    expect(swap.type).toBe('swap');
    expect(swap.assetPriceUsdAtTx).toBe(0.0164); // Uses enriched historic price
    expect(swap.counterPriceUsdAtTx).toBe(0.082); // Uses enriched historic price
  });

  it('handles enrichment returning empty array gracefully', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        hash: '0xtx1',
        timestamp,
        type: 'deposit',
        from: '0xother',
        to: '0xwallet',
        asset: 'HEX',
        amount: 100,
        chain: 'pulsechain',
      },
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue([]);

    const normalized = await normalizeTransactions(txs, walletAddrs);

    expect(normalized).toHaveLength(0);
  });

  it('continues with normalization when enrichment partially fails (returns some txs)', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();

    const rawTxs: Transaction[] = [
      {
        id: 'tx-1',
        hash: '0xtx1',
        timestamp,
        type: 'deposit',
        from: '0xother',
        to: '0xwallet',
        asset: 'HEX',
        amount: 100,
        chain: 'pulsechain',
        assetPriceUsdAtTx: undefined,
      },
      {
        id: 'tx-2',
        hash: '0xtx2',
        timestamp,
        type: 'deposit',
        from: '0xother',
        to: '0xwallet',
        asset: 'PULSE',
        amount: 50,
        chain: 'pulsechain',
        assetPriceUsdAtTx: undefined,
      },
    ];

    // Only first transaction enriched, second returned as-is (enrichment partial failure)
    const partiallyEnrichedTxs: Transaction[] = [
      { ...rawTxs[0], assetPriceUsdAtTx: 0.05 },
      { ...rawTxs[1] }, // No price enrichment
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(partiallyEnrichedTxs);

    const normalized = await normalizeTransactions(rawTxs, walletAddrs);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].assetPriceUsdAtTx).toBe(0.05); // Enriched
    expect(normalized[1].assetPriceUsdAtTx).toBeUndefined(); // Not enriched
  });

  it('maintains swap detection with enriched prices', async () => {
    const walletAddrs = new Set(['0xwallet']);
    const timestamp = new Date('2026-04-23T12:00:00Z').getTime();

    const rawTxs: Transaction[] = [
      {
        id: 'pls-out',
        hash: '0xswap',
        timestamp,
        type: 'withdraw',
        from: '0xwallet',
        to: '0xrouter',
        asset: 'PLS',
        amount: 1000,
        chain: 'pulsechain',
      },
      {
        id: 'hex-in',
        hash: '0xswap',
        timestamp,
        type: 'deposit',
        from: '0xrouter',
        to: '0xwallet',
        asset: 'HEX',
        amount: 5000,
        chain: 'pulsechain',
      },
    ];

    const enrichedTxs: Transaction[] = [
      { ...rawTxs[0], counterPriceUsdAtTx: 0.082 },
      { ...rawTxs[1], assetPriceUsdAtTx: 0.0164 },
    ];

    vi.spyOn(enrichmentPipeline, 'enrichTransactionsWithHistoricPrices').mockResolvedValue(enrichedTxs);

    const normalized = await normalizeTransactions(rawTxs, walletAddrs);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].type).toBe('swap');
    expect(normalized[0].id).toBe('0xswap-swap');
  });
});
