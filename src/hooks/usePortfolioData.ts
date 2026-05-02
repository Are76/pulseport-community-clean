import { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Asset, Transaction } from '../types';

// ── Pure helpers (exported for testing) ──────────────────────────────────────

export function normalizeAssetSymbol(symbol: string, chain: string): string {
  const upper = (symbol || '').toUpperCase();
  return chain === 'pulsechain' && upper === 'WPLS' ? 'PLS' : upper;
}

export function buildAssetByKey(assets: Asset[]): Map<string, Asset> {
  const map = new Map<string, Asset>();
  assets.forEach(a => {
    const norm = normalizeAssetSymbol(a.symbol, a.chain);
    map.set(`${a.chain}:${norm}`, a);
  });
  return map;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortfolioData {
  currentAssets: Asset[];
  currentTransactions: (Transaction & { assetUpper: string; counterAssetUpper?: string })[];
  assetByKey: Map<string, Asset>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const MOCK_ASSETS: Asset[] = [];
const MOCK_TRANSACTIONS: Transaction[] = [];
const ETH_HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';
const EHEX_PULSECHAIN_ADDR = '0x57fde0a71132198bbec939b98976993d8d89d225';

export function usePortfolioData(): PortfolioData {
  const {
    wallets, realAssets, walletAssets, transactions,
    hiddenTokens, hideDust, hideSpam, spamTokenIds,
    prices, manualEntries, customCoins,
  } = usePortfolio();

  // activeWallet not in context yet — will be added in Task 11
  const activeWallet: string | null = null;

  const assetUniverse = useMemo(() => {
    const activeWalletKey = activeWallet?.toLowerCase() ?? null;
    const base = wallets.length > 0
      ? (activeWalletKey ? (walletAssets[activeWalletKey] || []) : realAssets)
      : MOCK_ASSETS;
    const all = [...base];
    customCoins.forEach((coin: any) => {
      all.push({
        id: coin.id, symbol: coin.symbol, name: coin.name,
        balance: coin.balance, price: coin.price,
        value: coin.balance * coin.price,
        chain: 'custom' as any, pnl24h: 0,
      });
    });
    return all;
  }, [wallets.length, realAssets, walletAssets, activeWallet, customCoins]);

  const currentAssets = useMemo((): Asset[] => {
    return assetUniverse
      .filter(a => !hiddenTokens.includes(a.id))
      .filter(a => !hideDust || a.value >= 1 || (a.balance > 0 && a.price === 0))
      .filter(a => !hideSpam || (!(a as any).isSpam && !spamTokenIds.includes(a.id)))
      .map(a => {
        const addr = (a as any).address?.toLowerCase?.();
        const isEHex =
          (a.chain === 'ethereum' && addr === ETH_HEX_ADDR) ||
          (a.chain === 'pulsechain' && addr === EHEX_PULSECHAIN_ADDR);
        if (isEHex) {
          const ehexData = prices['hex'] || prices[`ethereum:${ETH_HEX_ADDR}`];
          if (ehexData?.usd) {
            return {
              ...a,
              price: ehexData.usd,
              value: a.balance * ehexData.usd,
              priceChange24h: ehexData.usd_24h_change ?? a.priceChange24h,
              priceChange1h: ehexData.usd_1h_change ?? a.priceChange1h,
              priceChange7d: ehexData.usd_7d_change ?? a.priceChange7d,
              pnl24h: ehexData.usd_24h_change ?? a.pnl24h,
              entryPls: manualEntries[a.id] || 0,
            };
          }
        }
        return { ...a, entryPls: manualEntries[a.id] || 0 };
      });
  }, [assetUniverse, manualEntries, hiddenTokens, hideDust, hideSpam, spamTokenIds, prices]);

  const currentTransactions = useMemo(() => {
    const base = wallets.length > 0 ? transactions : MOCK_TRANSACTIONS;
    return base.map(tx => {
      const asset = normalizeAssetSymbol(tx.asset, tx.chain);
      const counterAsset = tx.counterAsset
        ? normalizeAssetSymbol(tx.counterAsset, tx.chain)
        : tx.counterAsset;
      return {
        ...tx,
        asset,
        counterAsset,
        assetUpper: asset.toUpperCase(),
        counterAssetUpper: counterAsset?.toUpperCase(),
      };
    });
  }, [wallets.length, transactions]);

  const assetByKey = useMemo(
    () => buildAssetByKey(currentAssets),
    [currentAssets]
  );

  return { currentAssets, currentTransactions, assetByKey };
}
