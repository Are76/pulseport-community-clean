import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { Asset, Wallet, Transaction, HexStake } from '../types';
import type { HoldingDisplayAsset, HoldingSortField } from '../components/HoldingsTable';
import { HoldingsTable } from '../components/HoldingsTable';
import { LiquidityOverviewStrip } from '../components/LiquiditySection';

interface PortfolioSummary {
  totalValue: number;
  nativeValue: number;
  liquidValue: number;
  stakingValueUsd: number;
  pnl24h: number;
  pnl24hPercent: number;
  netInvestment: number;
  unifiedPnl: number;
}

interface OverviewTabProps {
  wallets: Wallet[];
  currentAssets: Asset[];
  currentStakes: HexStake[];
  currentTransactions: Transaction[];
  summary: PortfolioSummary;
  prices: Record<string, any>;
  tokenLogos: Record<string, string>;
  manualEntries: Record<string, number>;
  setManualEntries: (entries: Record<string, number>) => void;
  hiddenTokens: string[];
  hideToken: (id: string) => void;
  getTokenLogoUrl: (asset: any) => string;
  explorerUrl: (addr: string, chain: string) => string;
  dexScreenerUrl: (addr: string, chain: string) => string;
  tokenMarketData: Record<string, any>;
  t: any;
  theme: string;
  CHAIN_COLORS: Record<string, string>;
  STATIC_LOGOS: Record<string, string>;
  WALLET_DOT_COLORS: string[];
  normalizeHoldingAssets: (assets: Asset[]) => HoldingDisplayAsset[];
  setActiveTab: (tab: string) => void;
  setIsAddingWallet: (open: boolean) => void;
  setPnlAsset: (asset: Asset | null) => void;
  MIN_INVESTMENT_THRESHOLD: number;
  tokenPrices: Record<string, any>;
}

export function OverviewTab(props: OverviewTabProps) {
  const [overviewAssetSortField, setOverviewAssetSortField] = useState<HoldingSortField>('value');
  const [overviewAssetSortDir, setOverviewAssetSortDir] = useState<'asc' | 'desc'>('desc');
  const [overviewExpandedAssetIds, setOverviewExpandedAssetIds] = useState<Set<string>>(new Set());

  const MAX_HERO_HOLDINGS = 7;
  const holdingAssets = useMemo(() => [...props.currentAssets].sort((a, b) => b.value - a.value).slice(0, MAX_HERO_HOLDINGS), [props.currentAssets]);

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="overview-page-shell space-y-4"
      style={{ width: '100%', minWidth: 1 }}
    >
      <div>Overview Tab Placeholder</div>
    </motion.div>
  );
}
