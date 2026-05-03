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
      {/* Portfolio Summary Section */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '14px', color: props.t.textSecondary, marginBottom: '12px' }}>Total Portfolio Value</div>
        <div style={{ fontSize: '28px', fontWeight: 600, color: props.t.text }}>
          ${props.summary.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Liquidity Overview */}
      <LiquidityOverviewStrip
        walletAddresses={props.wallets.map(w => w.address)}
        tokenPrices={props.tokenPrices}
        onViewAll={() => props.setActiveTab('stakes')}
      />

      {/* Top Holdings */}
      {holdingAssets.length > 0 && (
        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text, marginBottom: '16px' }}>Top Holdings</div>
          <div className="space-y-2">
            {holdingAssets.slice(0, 5).map((asset, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: props.t.surface,
                borderRadius: '8px',
                fontSize: '14px',
              }}>
                <span style={{ color: props.t.text }}>{asset.symbol}</span>
                <span style={{ color: props.t.textSecondary }}>${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
