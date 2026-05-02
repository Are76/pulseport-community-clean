import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCcw,
  Eye,
  EyeOff,
  Shield,
  Calculator,
  X,
  ChevronDown,
  ChevronUp,
  Pencil
} from 'lucide-react';
import type { Asset, Wallet, Transaction } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { HoldingsTable } from '../components/HoldingsTable';
import type { HoldingDisplayAsset, HoldingSortField } from '../components/HoldingsTable';
import { TransactionList } from '../components/TransactionList';
import { cn } from '../lib/utils';

interface AssetsTabProps {
  selectedWalletAddr: string;
  currentAssets: Asset[];
  walletAssets: Record<string, Asset[]>;
  currentTransactions: Transaction[];
  collapsedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  isCollapsed: (id: string) => boolean;
  getTokenLogoUrl: (asset: any) => string;
  shortenAddr: (addr: string) => string;
  explorerUrl: (chain: string, addr?: string) => string;
  dexScreenerUrl: (chain: string, addr?: string) => string;
  t: {
    green: string;
    red: string;
    card: string;
    border: string;
    cardHigh: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    expandedBg: string;
    borderLight: string;
  };
  prices: Record<string, { usd: number }>;
  tokenLogos: Record<string, string>;
  hideDust: boolean;
  hideSpam: boolean;
  spamTokenIds: string[];
  hiddenTokens: string[];
  setHiddenTokens: (tokens: string[]) => void;
  hideToken: (id: string) => void;
  summary: {
    liquidValue: number;
    stakingValueUsd: number;
    totalValue: number;
  };
  wallets: Wallet[];
  setSelectedWalletAddr: (addr: string) => void;
  setActiveWallet: (wallet: Wallet | null) => void;
  isLoading: boolean;
  fetchPortfolio: () => Promise<void>;
  setIsAddingWallet: (open: boolean) => void;
  setEditingWalletAddress: (addr: string) => void;
  setEditWalletName: (name: string) => void;
  setPnlAsset: (asset: Asset | null) => void;
  pnlAsset: Asset | null;
  manualEntries: Record<string, number>;
  setManualEntries: (entries: Record<string, number>) => void;
  currentStakes: any[];
  customCoins: any[];
  scanForSpam: () => Promise<void>;
  isScanning: boolean;
  scanResult: number | null;
  setIsCustomCoinsModalOpen: (open: boolean) => void;
  CHAIN_COLORS: Record<string, string>;
  WALLET_DOT_COLORS: string[];
  STATIC_LOGOS: Record<string, string>;
}

export function AssetsTab({
  selectedWalletAddr,
  currentAssets,
  walletAssets,
  currentTransactions,
  collapsedSections,
  toggleSection,
  isCollapsed,
  getTokenLogoUrl,
  shortenAddr,
  explorerUrl,
  dexScreenerUrl,
  t,
  prices,
  tokenLogos,
  hideDust,
  hideSpam,
  spamTokenIds,
  hiddenTokens,
  setHiddenTokens,
  hideToken,
  summary,
  wallets,
  setSelectedWalletAddr,
  setActiveWallet,
  isLoading,
  fetchPortfolio,
  setIsAddingWallet,
  setEditingWalletAddress,
  setEditWalletName,
  setPnlAsset,
  pnlAsset,
  manualEntries,
  setManualEntries,
  currentStakes,
  customCoins,
  scanForSpam,
  isScanning,
  scanResult,
  setIsCustomCoinsModalOpen,
  CHAIN_COLORS,
  WALLET_DOT_COLORS,
  STATIC_LOGOS,
}: AssetsTabProps) {
  // ── Local state for Assets tab ──────────────────────────────────────────────
  const [walletChainFilter, setWalletChainFilter] = useState<'all' | 'pulsechain' | 'ethereum' | 'base'>('all');
  const [showHiddenCoins, setShowHiddenCoins] = useState(false);
  const [coinVisibilityMenuOpen, setCoinVisibilityMenuOpen] = useState(false);
  const [priceChangePeriod, setPriceChangePeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [assetSortField, setAssetSortField] = useState<'value' | 'change'>('value');
  const [assetSortDir, setAssetSortDir] = useState<'desc' | 'asc'>('desc');
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(new Set());
  const [allocationCalculatorOpen, setAllocationCalculatorOpen] = useState(false);
  const [allocationDraftPercentages, setAllocationDraftPercentages] = useState<Record<string, number>>({});

  // ── Hidden asset rows memo ─────────────────────────────────────────────────
  const hiddenAssetRows = useMemo(() => {
    const byId = new Map(currentAssets.map(a => [a.id, a]));
    return hiddenTokens.map(id => byId.get(id) ?? {});
  }, [currentAssets, hiddenTokens]);

  // ── Normalize holdings for display ──────────────────────────────────────────
  const normalizeHoldingAssets = useMemo(() => {
    return (assets: Asset[]): HoldingDisplayAsset[] => {
      return assets
        .filter(a => {
          if (hiddenTokens.includes(a.id)) return false;
          if (hideDust && (a.value ?? 0) < 1) return false;
          if (hideSpam && ((a as any).isSpam || spamTokenIds.includes(a.id))) return false;
          return true;
        })
        .map(a => {
          const priceUsd = a.price || 0;
          const pricePls = (prices[a.id]?.usd || 0) / (prices['PLS']?.usd || 1);
          return {
            ...a,
            priceChange1h: a.priceChange1h ?? 0,
            priceChange6h: (a as any).priceChange6h ?? 0,
            priceChange24h: a.priceChange24h ?? a.pnl24h ?? 0,
            priceChange7d: a.priceChange7d ?? 0,
            priceUsd,
            pricePls,
            valueUsd: a.value ?? 0,
            valuePls: ((a.value ?? 0) / (prices['PLS']?.usd || 1)),
            leagueLabel: '',
            leagueRank: null,
            leagueSource: null,
          };
        });
    };
  }, [hiddenTokens, hideDust, hideSpam, spamTokenIds, prices]);

  // ── Allocation calculator rows ─────────────────────────────────────────────
  const allocationCalculatorRows = useMemo(() => {
    const assetAllocation = currentAssets.map(a => ({
      name: a.symbol,
      value: a.value,
    }));
    return assetAllocation.map(a => {
      const pct = Math.min(100, Math.max(0, allocationDraftPercentages[a.name] ?? 0));
      const value = (summary.totalValue || 0) * (pct / 100);
      return { ...a, percent: pct, value };
    });
  }, [currentAssets, allocationDraftPercentages, summary.totalValue]);

  // ── Scope and wallet filtering ─────────────────────────────────────────────
  const selectedScope = selectedWalletAddr === 'all' ? null : wallets.find(w => w.address.toLowerCase() === selectedWalletAddr);
  const visibleWalletAssets = selectedScope ? (walletAssets[selectedWalletAddr] || []) : currentAssets;
  const selectedWalletStakes = selectedScope ? currentStakes.filter(s => s.walletAddress === selectedWalletAddr) : currentStakes;

  const selectedLiquidUsd = visibleWalletAssets.reduce((sum, asset) => sum + asset.value, 0);
  const selectedStakingUsd = selectedWalletStakes.reduce((sum, st) => {
    if ((st.daysRemaining ?? 0) <= 0) return sum;
    const hexPriceKey = `${st.chain}:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39`;
    const chainHexFallback = st.chain === 'pulsechain' ? prices['pulsechain:hex']?.usd : prices['hex']?.usd;
    const hexPrice = prices[hexPriceKey]?.usd || chainHexFallback || 0;
    const stakedHex = st.stakedHex ?? Number(st.stakedHearts ?? 0n) / 1e8;
    const tShares = st.tShares ?? Number(st.stakeShares ?? 0n) / 1e12;
    const daysStaked = Math.max(0, (st.stakedDays ?? 0) - (st.daysRemaining ?? 0));
    const rate = st.chain === 'pulsechain' ? 0.00368055 : 0.00100994;
    return sum + (stakedHex + tShares * daysStaked * rate) * hexPrice;
  }, 0);
  const selectedTotalUsd = selectedLiquidUsd + selectedStakingUsd;

  const chainAssets = walletChainFilter === 'all' ? currentAssets : currentAssets.filter(a => a.chain === walletChainFilter);
  const chainDisplayAssets = normalizeHoldingAssets(chainAssets);
  const hiddenChainAssets = walletChainFilter === 'all' ? hiddenAssetRows : hiddenAssetRows.filter(a => a.chain === walletChainFilter);

  return (
    <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="portfolio-page-shell space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* -- Wallet scope + management banner -- */}
      <div className="portfolio-wallet-banner portfolio-wallet-banner--premium">
        <div className="portfolio-wallet-head">
          <div className="portfolio-wallet-copy">
            <div className="portfolio-wallet-kicker">
              {selectedScope ? selectedScope.name : 'All Wallets'}
            </div>
            {selectedScope && (
              <div className="portfolio-wallet-address">
                {selectedScope.address.slice(0, 10)}...{selectedScope.address.slice(-8)}
              </div>
            )}
          </div>
          <div className="portfolio-wallet-actions">
            {selectedScope && (
              <>
                <button className="btn-ghost portfolio-wallet-action" onClick={() => navigator.clipboard.writeText(selectedScope.address)}>
                  <Copy size={13} /> Copy
                </button>
                <button className="btn-ghost portfolio-wallet-action" onClick={() => { setEditingWalletAddress(selectedScope.address); setEditWalletName(selectedScope.name); }}>
                  <Pencil size={13} /> Rename
                </button>
              </>
            )}
            <button className="btn-primary portfolio-wallet-action portfolio-wallet-action--primary" onClick={() => setIsAddingWallet(true)}>
              <Plus size={13} /> Add Wallet
            </button>
          </div>
        </div>
        <div className="portfolio-wallet-value">
          ${(selectedScope ? selectedTotalUsd : summary.totalValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
        <div className="portfolio-wallet-summary">
          <span className="wallet-stat-pill-green">
            Liquid ${(selectedScope ? selectedLiquidUsd : summary.liquidValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="portfolio-wallet-pill portfolio-wallet-pill--staking" style={{ color: t.red }}>
            Staking ${(selectedScope ? selectedStakingUsd : summary.stakingValueUsd).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="portfolio-wallet-pill">
            {visibleWalletAssets.length} token{visibleWalletAssets.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="wallet-selector-bar portfolio-wallet-selector">
          <button
            className={`wallet-pill${selectedWalletAddr === 'all' ? ' active' : ''}`}
            onClick={() => { setSelectedWalletAddr('all'); setActiveWallet(null); }}
          >
            <span className="wallet-dot wallet-dot-multi" />
            All
          </button>
          {wallets.map((wallet, idx) => {
            const walletKey = wallet.address.toLowerCase();
            const isWalletActive = selectedWalletAddr === walletKey;
            const dotColor = WALLET_DOT_COLORS[idx % WALLET_DOT_COLORS.length];
            const walletValue = (walletAssets[walletKey] || []).reduce((sum, asset) => sum + asset.value, 0);
            return (
              <button
                key={wallet.address}
                className={`wallet-pill${isWalletActive ? ' active' : ''}`}
                title={wallet.address}
                onClick={() => { setSelectedWalletAddr(walletKey); setActiveWallet(wallet); }}
                style={isWalletActive ? { background: `${dotColor}1a`, borderColor: `${dotColor}55`, color: dotColor } : undefined}
              >
                <span className="wallet-dot" style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}bb` }} />
                <span>{wallet.name || shortenAddr(wallet.address)}</span>
                <span style={{ color: 'var(--fg-subtle)', fontSize: 11 }}>${walletValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </button>
            );
          })}
        </div>
        <div className="portfolio-chain-filter-row">
          {(['all', 'pulsechain', 'ethereum', 'base'] as const).map(c => (
            <button key={c} onClick={() => setWalletChainFilter(c)}
              className={`filter-pill${walletChainFilter === c ? ' active' : ''}`}>
              {c === 'all' ? 'All' : c === 'pulsechain' ? 'PulseChain' : c === 'ethereum' ? 'Ethereum' : 'Base'}
            </button>
          ))}
        </div>
      </div>

      {/* -- Coin visibility panel -- */}
      <div className={`coin-visibility-panel${coinVisibilityMenuOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="coin-visibility-trigger"
          onClick={() => setCoinVisibilityMenuOpen(v => !v)}
          aria-expanded={coinVisibilityMenuOpen}
        >
          <div className="coin-visibility-copy">
            <span>Coin visibility</span>
            <strong>Wallet coins are auto-detected on refresh.</strong>
            <small>
              Open filters, hidden coins, manual coins, and spam scan controls.
            </small>
          </div>
          <div className="coin-visibility-stats">
            <span>{hiddenTokens.length} hidden</span>
            <span>{customCoins.length} manual</span>
            <span>{hideDust ? 'Dust hidden' : 'Dust visible'}</span>
            <span>{hideSpam ? 'Spam hidden' : 'Spam visible'}</span>
          </div>
          <ChevronDown size={16} className="coin-visibility-chevron" />
        </button>
        {coinVisibilityMenuOpen && (
          <div className="coin-visibility-dropdown-panel">
            <div className="coin-visibility-actions">
              <button type="button" onClick={fetchPortfolio}>
                <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
                Refresh / detect
              </button>
              <button type="button" onClick={() => setShowHiddenCoins(v => !v)}>
                <Eye size={13} />
                {showHiddenCoins ? 'Close hidden coins' : 'Open hidden coins'}
                {hiddenTokens.length > 0 && <span className="hidden-coins-count">{hiddenTokens.length}</span>}
              </button>
              <button type="button" className="coin-visibility-primary" onClick={() => setIsCustomCoinsModalOpen(true)}>
                <Plus size={13} />
                Add coin
              </button>
              <button type="button" onClick={scanForSpam} disabled={isScanning || wallets.length === 0}>
                <Shield size={13} />
                {isScanning ? 'Scanning...' : 'Scan spam'}
                {scanResult !== null && !isScanning && (
                  <span className="hidden-coins-count">{scanResult > 0 ? `+${scanResult}` : 'clean'}</span>
                )}
              </button>
            </div>
            <div className="coin-visibility-dropdown">
              <button type="button" onClick={() => {}}>
                <span>Hide dust coins</span>
                <small>Dust filter controls</small>
              </button>
              <button type="button" onClick={() => {}}>
                <span>Hide spam coins</span>
                <small>Spam filter controls</small>
              </button>
              <button type="button" disabled={hiddenTokens.length === 0} onClick={() => { setHiddenTokens([]); setShowHiddenCoins(false); }}>
                <span>Unhide all manual coins</span>
                <small>Restore every hidden coin</small>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -- Header row -- */}
      <div className="portfolio-section-topbar">
        <div className="portfolio-section-heading">
          <div className="portfolio-section-title">Holdings</div>
          <div className="portfolio-section-subtitle">{chainAssets.length} token{chainAssets.length !== 1 ? 's' : ''}  -  ${summary.liquidValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} liquid</div>
        </div>
        <div className="portfolio-section-actions">
          <div className="portfolio-period-switch">
            {([['1h','1H'],['6h','6H'],['24h','24H'],['7d','7D']] as const).map(([p, label]) => (
              <button key={p} onClick={() => setPriceChangePeriod(p)} className={`portfolio-period-button ${priceChangePeriod === p ? 'is-active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Token Table -- */}
      <div className="portfolio-holdings-shell md-elevation-1" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div className={`portfolio-panel-header ${isCollapsed('assets-table') ? '' : 'portfolio-panel-header--divided'}`}>
          <div className="portfolio-panel-heading">
            <div className="portfolio-panel-title">Assets</div>
            <div className="portfolio-panel-subtitle">{chainAssets.length} tokens  -  ${summary.liquidValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="portfolio-panel-actions">
            <button
              type="button"
              onClick={() => setAllocationCalculatorOpen(v => !v)}
              className={`portfolio-inline-action ${allocationCalculatorOpen ? 'is-active' : ''}`}
            >
              <Calculator size={13} />
              {allocationCalculatorOpen ? 'Close Calculator' : 'Open Calculator'}
            </button>
            <button
              onClick={() => toggleSection('assets-table')}
              className="overview-panel-toggle"
              aria-label={isCollapsed('assets-table') ? 'Expand assets table' : 'Collapse assets table'}
              aria-expanded={!isCollapsed('assets-table')}
              title={isCollapsed('assets-table') ? 'Expand' : 'Collapse'}
            >
              {isCollapsed('assets-table') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
        {!isCollapsed('assets-table') && (<>
          {allocationCalculatorOpen && (
            <div style={{ margin: '0 16px 16px', padding: '16px 18px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.cardHigh, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Adjust Allocation</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>
                  Total: {allocationCalculatorRows.reduce((sum, r) => sum + r.percent, 0).toFixed(1)}%
                </div>
              </div>
              {allocationCalculatorRows.length > 0 ? allocationCalculatorRows.map((row, i) => (
                <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px', alignItems: 'center', gap: 10 }} className="max-sm:grid-cols-1">
                  <span style={{ fontSize: 13, color: t.text }}>{row.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={row.percent}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setAllocationDraftPercentages(prev => ({ ...prev, [row.name]: next }));
                    }}
                    style={{ accentColor: ['#00FF9F','#627EEA','#f97316','#a855f7','#f59e0b','#06b6d4','#ec4899'][i % 7] }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={row.percent.toFixed(1)}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setAllocationDraftPercentages(prev => ({ ...prev, [row.name]: Math.min(100, Math.max(0, next)) }));
                    }}
                    style={{ width: '100%', background: t.card, color: t.text, border: `1px solid ${t.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-shell-display)', fontWeight: 700, letterSpacing: '-0.01em' }}
                  />
                  <span style={{ fontSize: 12, color: t.textSecondary, textAlign: 'right', fontFamily: 'var(--font-shell-display)', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    ${row.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: 13, color: t.textMuted }}>No holdings available for allocation calculator.</div>
              )}
            </div>
          )}
          <HoldingsTable
            assets={chainDisplayAssets}
            allAssets={currentAssets}
            wallets={wallets}
            totalValueUsd={summary.totalValue}
            plsUsdPrice={prices['pulsechain']?.usd || 0}
            priceChangePeriod={priceChangePeriod}
            sortField={assetSortField as HoldingSortField}
            sortDir={assetSortDir}
            expandedIds={expandedAssetIds}
            tokenLogos={tokenLogos}
            emptyMessage="No holdings found - add wallets to get started"
            currentTransactions={currentTransactions}
            manualEntries={manualEntries}
            chainColors={CHAIN_COLORS}
            tokenMarketData={{}}
            staticLogos={STATIC_LOGOS}
            getTokenLogoUrl={getTokenLogoUrl}
            explorerUrl={explorerUrl}
            dexScreenerUrl={dexScreenerUrl}
            onSort={(field) => {
              if (assetSortField === field) setAssetSortDir(d => d === 'desc' ? 'asc' : 'desc');
              else { setAssetSortField(field); setAssetSortDir('desc'); }
            }}
            onToggleExpanded={(id) => setExpandedAssetIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
            onOpenPnl={asset => setPnlAsset(asset)}
            onHide={hideToken}
            onSetEntry={(id, value) => setManualEntries({ ...manualEntries, [id]: value })}
            onClearEntry={(id) => { const n = { ...manualEntries }; delete n[id]; setManualEntries(n); }}
            onFilterByAsset={() => {}}
            showSkeleton={isLoading && wallets.length > 0 && currentAssets.length === 0}
            footerValueUsd={chainAssets.reduce((sum, asset) => sum + asset.value, 0)}
            shareBaseUsd={summary.totalValue}
          />
        </>)}
      </div>
    </motion.div>
  );
}
