import { describe, it, expect } from 'vitest';
import { buildWalletMap, buildAssetMap } from '../components/TransactionList';
import type { Wallet, Asset } from '../types';

describe('buildWalletMap', () => {
  it('maps lowercase address to wallet name', () => {
    const wallets: Wallet[] = [
      { address: '0xABC', name: 'Hot Wallet' },
      { address: '0xDEF', name: '' },
    ];
    const m = buildWalletMap(wallets);
    expect(m.get('0xabc')).toBe('Hot Wallet');
    expect(m.get('0xdef')).toBe('');
    expect(m.size).toBe(2);
  });

  it('returns empty map for empty array', () => {
    expect(buildWalletMap([]).size).toBe(0);
  });
});

describe('buildAssetMap', () => {
  it('maps chain:normalizedSymbol to Asset', () => {
    const assets: Asset[] = [
      { id: 'wpls', symbol: 'WPLS', name: 'Wrapped PLS', balance: 100, price: 0.0001, value: 0.01, chain: 'pulsechain' },
      { id: 'eth',  symbol: 'ETH',  name: 'Ethereum',    balance: 1,   price: 3000,  value: 3000, chain: 'ethereum' },
    ];
    const m = buildAssetMap(assets);
    // WPLS on pulsechain normalizes to PLS
    expect(m.get('pulsechain:PLS')).toBeDefined();
    expect(m.get('ethereum:ETH')).toBeDefined();
    expect(m.size).toBe(2);
  });

  it('returns empty map for empty array', () => {
    expect(buildAssetMap([]).size).toBe(0);
  });
});

describe('buildAssetMap round-trip', () => {
  it('key used to build matches key used to look up', () => {
    const asset: Asset = { symbol: 'WPLS', chain: 'pulsechain', price: 0.0001, value: 0.01 } as Asset;
    const m = buildAssetMap([asset]);
    // normalizeSymbol('WPLS', 'pulsechain') => 'PLS' (WPLS is the wrapped native on pulsechain)
    const key = 'pulsechain:PLS';
    expect(m.get(key)).toBe(asset);
  });
});
