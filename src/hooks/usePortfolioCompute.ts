import { useMemo } from 'react';
import type { Asset, HexStake } from '../types';
import { TOKENS, PHEX_YIELD_PER_TSHARE, EHEX_YIELD_PER_TSHARE, PHEX_YIELD_BI_NUM, PHEX_YIELD_BI_DEN, EHEX_YIELD_BI_NUM, EHEX_YIELD_BI_DEN } from '../constants';
import { normalizeAssetSymbol } from '../utils/assetHelpers';
import { ETH_HEX_ADDR, EHEX_PULSECHAIN_ADDR, MIN_INVESTMENT_THRESHOLD, TIME_WINDOWS } from '../utils/appConstants';

interface PortfolioComputeInput {
  wallets: any[];
  realAssets: Asset[];
  realStakes: HexStake[];
  prices: Record<string, any>;
  manualEntries: Record<string, number>;
  hiddenTokens: string[];
  hideDust: boolean;
  hideSpam: boolean;
  spamTokenIds: string[];
  walletAssets: Record<string, Asset[]>;
  activeWallet: string | null;
  tokenMarketData: Record<string, any>;
  transactions: any[];
  history: any[];
  customCoins: any[];
  collapsedSections: Record<string, boolean>;
}

/**
 * Computes the full portfolio state from raw assets, stakes, prices, and user preferences.
 * @returns Filtered assets, current stakes, LP positions, and computed summary figures.
 */
export function usePortfolioCompute(input: PortfolioComputeInput) {
  const {
    wallets, realAssets, realStakes, prices, manualEntries, hiddenTokens, hideDust, hideSpam, spamTokenIds,
    walletAssets, activeWallet, tokenMarketData, transactions, history, customCoins, collapsedSections
  } = input;

  const assetUniverse = useMemo(() => {
    const activeWalletKey = activeWallet?.toLowerCase() ?? null;
    const baseAssets = wallets.length > 0
      ? (activeWalletKey ? (walletAssets[activeWalletKey] || []) : realAssets)
      : [];
    const assetsWithCustom = [...baseAssets];

    customCoins.forEach(coin => {
      assetsWithCustom.push({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        balance: coin.balance,
        price: coin.price,
        value: coin.balance * coin.price,
        chain: 'custom' as any,
        pnl24h: 0
      });
    });

    return assetsWithCustom;
  }, [wallets.length, realAssets, walletAssets, activeWallet, customCoins]);

  const currentAssets = useMemo(() => {
    return assetUniverse
      .filter(a => !hiddenTokens.includes(a.id))
      .filter(a => !hideDust || a.value >= 1 || (a.balance > 0 && a.price === 0))
      .filter(a => !hideSpam || (!(a as any).isSpam && !spamTokenIds.includes(a.id)))
      .map(a => {
        const addr = (a as any).address?.toLowerCase?.();
        const isEHex = (a.chain === 'ethereum' && addr === ETH_HEX_ADDR) || (a.chain === 'pulsechain' && addr === EHEX_PULSECHAIN_ADDR);
        if (isEHex) {
          const ehexPriceData = prices['hex'] || prices[`ethereum:${ETH_HEX_ADDR}`];
          if (ehexPriceData?.usd) {
            const price = ehexPriceData.usd;
            return {
              ...a,
              price,
              value: a.balance * price,
              priceChange24h: ehexPriceData.usd_24h_change ?? a.priceChange24h,
              priceChange1h: ehexPriceData.usd_1h_change ?? a.priceChange1h,
              priceChange7d: ehexPriceData.usd_7d_change ?? a.priceChange7d,
              pnl24h: ehexPriceData.usd_24h_change ?? a.pnl24h,
              entryPls: manualEntries[a.id] || 0
            };
          }
        }
        return {
          ...a,
          entryPls: manualEntries[a.id] || 0
        };
      });
  }, [assetUniverse, manualEntries, hiddenTokens, hideDust, hideSpam, spamTokenIds, prices]);

  const currentStakes = useMemo(() => {
    if (wallets.length === 0) return [];
    const key = activeWallet?.toLowerCase() ?? null;
    return key ? realStakes.filter(s => s.walletAddress === key) : realStakes;
  }, [wallets.length, realStakes, activeWallet]);

  const normalizeHoldingAssets = useMemo(() => {
    const plsUsdPrice = prices['pulsechain']?.usd || 0;
    const leagueSymbols = new Set(['PLS', 'PLSX', 'HEX', 'EHEX', 'INC', 'PRVX']);
    return (assets: Asset[]) =>
      assets.map(asset => {
        const symbolUpper = asset.symbol.toUpperCase();
        const isLeagueSupported = leagueSymbols.has(symbolUpper);
        return {
          ...asset,
          priceUsd: asset.price,
          pricePls: plsUsdPrice > 0 ? asset.price / plsUsdPrice : 0,
          valueUsd: asset.value,
          valuePls: plsUsdPrice > 0 ? asset.value / plsUsdPrice : 0,
          leagueLabel: isLeagueSupported ? 'League' : '-',
          leagueRank: null,
          leagueSource: isLeagueSupported ? 'OpenPulseChain' : null,
          entryPls: manualEntries[asset.id] || 0,
        };
      });
  }, [manualEntries, prices]);

  const currentTransactions = useMemo(() => {
    return transactions.map(tx => ({
      ...tx,
      asset: normalizeAssetSymbol(tx.asset, tx.chain),
      counterAsset: tx.counterAsset ? normalizeAssetSymbol(tx.counterAsset, tx.chain) : tx.counterAsset,
    }));
  }, [transactions]);

  const unpricedCount = useMemo(() => {
    return currentAssets.filter(a => a.price === 0).length;
  }, [currentAssets]);

  const swapTransactions24h = useMemo(() => {
    const cutoff = Date.now() - TIME_WINDOWS.HOURS_24;
    return currentTransactions.filter((tx) => {
      if (tx.chain !== 'pulsechain') return false;
      if (tx.timestamp < cutoff) return false;
      return tx.type === 'swap' || tx.type === 'liquidated';
    });
  }, [currentTransactions]);

  const summary = useMemo(() => {
    let totalValue = 0;
    let liquidValue = 0;
    let stakingValueUsd = 0;
    let netInvestment = 0;

    currentAssets.forEach(a => {
      totalValue += a.value;
      if (a.chain !== 'custom') liquidValue += a.value;
    });

    currentStakes.forEach(stake => {
      const hexPrice = prices['pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd || prices['pulsechain:hex']?.usd || 0;
      stakingValueUsd += stake.stakedBalance * hexPrice;
      totalValue += stake.stakedBalance * hexPrice;
    });

    return {
      totalValue,
      liquidValue,
      stakingValueUsd,
      netInvestment,
    };
  }, [currentAssets, currentStakes, prices]);

  return {
    assetUniverse,
    currentAssets,
    currentStakes,
    normalizeHoldingAssets,
    currentTransactions,
    unpricedCount,
    swapTransactions24h,
    summary,
  };
}
