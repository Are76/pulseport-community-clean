import { describe, it, expect } from 'vitest';
import type { Asset } from '../types';
import { buildAssetByKey, normalizeAssetSymbol } from '../hooks/usePortfolioData';

const makeAsset = (symbol: string, chain: string, price = 1): Asset => ({
  id: `${chain}:${symbol}`,
  symbol, name: symbol, balance: 1, price, value: price,
  chain: chain as any, pnl24h: 0,
});

describe('buildAssetByKey', () => {
  it('keys assets by chain:UPPERCASE_SYMBOL', () => {
    const assets = [makeAsset('hex', 'pulsechain')];
    const map = buildAssetByKey(assets);
    expect(map.has('pulsechain:HEX')).toBe(true);
  });

  it('normalizes WPLS → PLS on pulsechain', () => {
    const assets = [makeAsset('WPLS', 'pulsechain')];
    const map = buildAssetByKey(assets);
    expect(map.has('pulsechain:PLS')).toBe(true);
    expect(map.has('pulsechain:WPLS')).toBe(false);
  });

  it('does not normalize WPLS on ethereum', () => {
    const assets = [makeAsset('WPLS', 'ethereum')];
    const map = buildAssetByKey(assets);
    expect(map.has('ethereum:WPLS')).toBe(true);
  });

  it('returns the correct asset for a key', () => {
    const asset = makeAsset('PLS', 'pulsechain', 0.00001);
    const map = buildAssetByKey([asset]);
    expect(map.get('pulsechain:PLS')).toBe(asset);
  });
});

describe('normalizeAssetSymbol', () => {
  it('uppercases symbol', () => {
    expect(normalizeAssetSymbol('hex', 'pulsechain')).toBe('HEX');
  });
  it('converts WPLS to PLS on pulsechain', () => {
    expect(normalizeAssetSymbol('WPLS', 'pulsechain')).toBe('PLS');
  });
  it('leaves WPLS alone on ethereum', () => {
    expect(normalizeAssetSymbol('WPLS', 'ethereum')).toBe('WPLS');
  });
});
