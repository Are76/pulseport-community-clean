import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { History, Download, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Transaction } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { TransactionList } from '../components/TransactionList';
import { sameAssetSymbol } from '../utils/assetHelpers';

interface HistoryTabProps {
  selectedWalletAddr: string;
  getTokenLogoUrl: (asset: any) => string;
  shortenAddr?: (addr: string) => string;
  collapsedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  isCollapsed: (id: string) => boolean;
  t: {
    green: string;
    red: string;
  };
}

export function HistoryTab({
  selectedWalletAddr,
  getTokenLogoUrl,
  shortenAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`,
  collapsedSections,
  toggleSection,
  isCollapsed,
  t,
}: HistoryTabProps) {
  const { wallets, prices, hiddenTxIds, setHiddenTxIds, tokenLogos } = usePortfolio();
  const { currentTransactions, currentAssets, assetByKey } = usePortfolioData();

  // ── Local filter state (7 items moved from App.tsx) ────────────────────────
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txAssetFilter, setTxAssetFilter] = useState<string>('all');
  const [txYearFilter, setTxYearFilter] = useState<string>('all');
  const [txCoinCategory, setTxCoinCategory] = useState<string>('all');
  const [viewAsYou, setViewAsYou] = useState(false);
  const [txCompact, setTxCompact] = useState(false);
  const [showHiddenTxs, setShowHiddenTxs] = useState(false);

  // ── matchesHistoryTransactionFilters callback ──────────────────────────────
  const matchesHistoryTransactionFilters = useCallback((tx: Transaction) => {
    const walletKey = selectedWalletAddr.toLowerCase();
    const matchesWallet = walletKey === 'all' ||
      tx.from?.toLowerCase() === walletKey ||
      tx.to?.toLowerCase() === walletKey ||
      (tx as any).walletAddress?.toLowerCase?.() === walletKey;
    const matchesAsset = txAssetFilter === 'all' ||
      sameAssetSymbol(tx.asset, txAssetFilter, tx.chain) ||
      sameAssetSymbol(tx.counterAsset ?? '', txAssetFilter, tx.chain);
    const txYear = new Date(tx.timestamp).getFullYear().toString();
    const matchesYear = txYearFilter === 'all' || txYear === txYearFilter;
    const assetUpper = tx.asset.toUpperCase();
    let matchesCoin = true;
    if (txCoinCategory === 'stablecoins') {
      matchesCoin = assetUpper.includes('USDC') || assetUpper.includes('USDT') || assetUpper.includes('DAI') ||
                    assetUpper.includes('TETHER') || assetUpper.includes('USD COIN') || assetUpper.includes('USDBC');
    } else if (txCoinCategory === 'eth_weth') {
      matchesCoin = assetUpper === 'ETH' || assetUpper === 'WETH';
    } else if (txCoinCategory === 'hex') {
      matchesCoin = assetUpper === 'HEX' || assetUpper === 'EHEX' || assetUpper.includes('HEX');
    } else if (txCoinCategory === 'pls_wpls') {
      matchesCoin = assetUpper === 'PLS' || assetUpper === 'WPLS';
    } else if (txCoinCategory === 'bridged') {
      matchesCoin = !!(tx as any).bridged;
    }
    return matchesWallet && matchesAsset && matchesYear && matchesCoin;
  }, [selectedWalletAddr, txAssetFilter, txYearFilter, txCoinCategory]);

  // ── filteredTransactions memo ──────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    return currentTransactions.filter(tx => {
      if (!matchesHistoryTransactionFilters(tx)) return false;
      const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter ||
        (txTypeFilter === 'swap' && !!tx.swapLegOnly);
      return matchesType;
    });
  }, [currentTransactions, matchesHistoryTransactionFilters, txTypeFilter]);

  // ── swapAssetFilterOptions memo ────────────────────────────────────────────
  const swapAssetFilterOptions = useMemo<[string, string][]>(() => {
    const symbols = Array.from(new Set<string>(
      currentTransactions
        .flatMap((tx) => [tx.asset, tx.counterAsset].filter(Boolean) as string[])
    )).sort((a, b) => a.localeCompare(b));
    return [['all', 'All Tokens'], ...symbols.map((symbol) => [symbol, symbol] as [string, string])];
  }, [currentTransactions]);

  // ── swapYearFilterOptions memo ─────────────────────────────────────────────
  const swapYearFilterOptions = useMemo<[string, string][]>(() => {
    const years = Array.from(new Set(
      currentTransactions
        .map((tx) => new Date(tx.timestamp).getFullYear().toString())
    )).sort((a, b) => Number(b) - Number(a));
    return [['all', 'All Years'], ...years.map((year) => [year, year] as [string, string])];
  }, [currentTransactions]);

  const hasActiveSwapFilters = txAssetFilter !== 'all' || txYearFilter !== 'all' || txCoinCategory !== 'all';

  // ── activeHistoryAsset memo ────────────────────────────────────────────────
  const activeHistoryAsset = useMemo(() => {
    if (txAssetFilter === 'all') return undefined;
    return currentAssets.find(asset => sameAssetSymbol(asset.symbol, txAssetFilter, asset.chain));
  }, [currentAssets, txAssetFilter]);

  // ── historySummary memo ────────────────────────────────────────────────────
  const historySummary = useMemo(() => {
    const swaps = filteredTransactions;
    const swapCount = swaps.length;
    const gasPls = swaps.reduce((sum, tx) => sum + (tx.fee ?? 0), 0);
    const gasUsd = gasPls * (prices['pulsechain']?.usd ?? 0);
    const tokenTxs = txAssetFilter === 'all'
      ? swaps
      : currentTransactions.filter(tx =>
          (tx.type === 'swap' || !!tx.swapLegOnly) &&
          tx.chain === 'pulsechain' &&
          (sameAssetSymbol(tx.asset, txAssetFilter, tx.chain) ||
           sameAssetSymbol(tx.counterAsset ?? '', txAssetFilter, tx.chain))
        );

    let cost = 0;
    let proceeds = 0;
    let bought = 0;
    let sold = 0;
    let aggregateSwapPnl = 0;

    tokenTxs.forEach(tx => {
      const usd = tx.valueUsd ?? 0;
      const assetMatches = txAssetFilter === 'all' || sameAssetSymbol(tx.asset, txAssetFilter, tx.chain);
      const counterMatches = txAssetFilter !== 'all' && sameAssetSymbol(tx.counterAsset ?? '', txAssetFilter, tx.chain);
      const currentAsset = currentAssets.find(asset => sameAssetSymbol(asset.symbol, tx.asset, asset.chain) && asset.chain === tx.chain);

      if (assetMatches && currentAsset?.price && tx.amount > 0 && usd > 0) {
        aggregateSwapPnl += (tx.amount * currentAsset.price) - usd;
      }

      if (assetMatches) {
        bought += tx.amount;
        cost += usd;
      }

      if (counterMatches) {
        sold += tx.counterAmount ?? 0;
        proceeds += usd;
      }
    });

    const averageCost = bought > 0 ? cost / bought : 0;
    const realizedCost = Math.min(cost, sold * averageCost);
    const realizedPnl = txAssetFilter === 'all' ? aggregateSwapPnl : proceeds - realizedCost;
    const holdingsValue = txAssetFilter === 'all'
      ? currentAssets.filter(asset => asset.chain === 'pulsechain').reduce((sum, asset) => sum + asset.value, 0)
      : activeHistoryAsset ? activeHistoryAsset.balance * activeHistoryAsset.price : 0;

    return {
      swapCount,
      gasPls,
      gasUsd,
      tokenTxs,
      realizedPnl,
      holdingsValue,
    };
  }, [filteredTransactions, prices, txAssetFilter, currentTransactions, activeHistoryAsset, currentAssets]);

  // ── plsSwapData memo ───────────────────────────────────────────────────────
  const plsSwapData = useMemo(() => {
    const isPls = (sym: string) => {
      const u = (sym || '').toUpperCase();
      return u === 'PLS' || u === 'WPLS';
    };
    const plsPrice = prices['pulsechain']?.usd || 0;

    const rows = currentTransactions
      .filter(tx => {
        if (tx.type === 'swap' && (isPls(tx.asset) || isPls(tx.counterAsset || ''))) return true;
        if (tx.chain === 'pulsechain' && isPls(tx.asset) && (tx.type === 'deposit' || tx.type === 'withdraw')) return true;
        return false;
      })
      .map(tx => {
        let plsReceived = 0;
        let plsSpent = 0;
        if (tx.type === 'swap') {
          plsReceived = isPls(tx.asset) ? tx.amount : 0;
          plsSpent = isPls(tx.counterAsset || '') ? (tx.counterAmount || 0) : 0;
        } else if (tx.type === 'deposit') {
          plsReceived = tx.amount;
        } else if (tx.type === 'withdraw') {
          plsSpent = tx.amount;
        }
        const netPls = plsReceived - plsSpent;
        return { tx, plsReceived, plsSpent, netPls };
      })
      .sort((a, b) => b.tx.timestamp - a.tx.timestamp);

    const totalReceived = rows.reduce((s, r) => s + r.plsReceived, 0);
    const totalSpent = rows.reduce((s, r) => s + r.plsSpent, 0);
    const totalNet = totalReceived - totalSpent;
    const netUsd = totalNet * plsPrice;
    return { rows, totalReceived, totalSpent, totalNet, netUsd, plsPrice };
  }, [currentTransactions, prices]);

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const handleToggleHide = useCallback((id: string) => {
    setHiddenTxIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [setHiddenTxIds]);

  const handleFilterByAssetSwap = useCallback((symbol: string) => {
    setTxAssetFilter(symbol);
    setTxTypeFilter('swap');
  }, []);

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escCell = (c: string | number) => {
      const s = String(c);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers, ...rows].map(r => r.map(escCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="transaction-page-shell transaction-page-shell--reset space-y-4">
      <div className="transaction-page-head transaction-page-head--premium">
        <div className="transaction-page-head-main">
          <span className="transaction-page-kicker">Transactions</span>
          <h1 className="transaction-page-title">
            {txAssetFilter === 'all' ? 'PulseChain Swap Ledger' : `${txAssetFilter} Swap Ledger`}
          </h1>
          <p className="transaction-page-subtitle">
            Review every routed swap, isolate token-specific execution, and read realized performance without leaving the ledger.
          </p>
          <div className="transaction-page-chip-row">
            <span className="tx-band-chip tx-band-chip--accent">Swaps only</span>
            <span className="tx-band-chip">{selectedWalletAddr === 'all' ? 'All wallets' : shortenAddr(selectedWalletAddr)}</span>
            <span className="tx-band-chip">{txYearFilter === 'all' ? 'All years' : txYearFilter}</span>
            <span className="tx-band-chip">{txCoinCategory === 'all' ? 'All coin families' : txCoinCategory === 'stablecoins' ? 'Stablecoins' : txCoinCategory === 'eth_weth' ? 'ETH/WETH' : txCoinCategory === 'hex' ? 'HEX/eHEX' : txCoinCategory === 'pls_wpls' ? 'PLS/WPLS' : 'Bridged'}</span>
          </div>
        </div>
        <div className="transaction-page-head-side">
          <div className="transaction-page-stats">
            <div className="transaction-page-stat">
              <span>Tracked swaps</span>
              <strong>{filteredTransactions.length}</strong>
            </div>
            <div className="transaction-page-stat">
              <span>Realized P&L</span>
              <strong style={{ color: historySummary.realizedPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {historySummary.realizedPnl >= 0 ? '+' : '-'}${Math.abs(historySummary.realizedPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="transaction-page-stat">
              <span>Holdings value</span>
              <strong>${historySummary.holdingsValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="transaction-page-stat">
              <span>Gas total</span>
              <strong>{historySummary.gasPls.toLocaleString('en-US', { maximumFractionDigits: 4 })} PLS</strong>
              <small>${historySummary.gasUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</small>
            </div>
          </div>
          <div className="transaction-page-head-actions">
            <button type="button" className={`filter-pill${viewAsYou ? ' active' : ''}`} aria-pressed={viewAsYou} onClick={() => setViewAsYou(v => !v)}>
              View as You
            </button>
            <button type="button" className={`filter-pill${txCompact ? ' active' : ''}`} aria-pressed={txCompact} onClick={() => setTxCompact(v => !v)}>
              Compact
            </button>
            <button
              type="button"
              onClick={() => {
                const hdrs = ['Date', 'Asset Out', 'Amount Out', 'Asset In', 'Amount In', 'Value USD', 'Chain', 'Hash'];
                const rows = filteredTransactions.map(tx => [
                  new Date(tx.timestamp).toISOString().slice(0, 10),
                  tx.counterAsset ?? '',
                  tx.counterAmount ?? '',
                  tx.asset,
                  tx.amount,
                  tx.valueUsd ?? '',
                  tx.chain,
                  tx.hash ?? '',
                ]);
                exportCSV(`pulseport-swaps-${Date.now()}.csv`, hdrs, rows);
              }}
              className="history-csv-btn"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {txAssetFilter !== 'all' && (
        <div className="tx-context-strip">
          <div className="tx-context-title">
            {activeHistoryAsset && (
              <img
                src={getTokenLogoUrl(activeHistoryAsset)}
                alt={txAssetFilter}
                className="tx-context-logo"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div>
              <strong>{txAssetFilter} Swap P&L</strong>
              <span>{historySummary.tokenTxs.length} swap rows tracked</span>
            </div>
          </div>
          <div className="tx-context-metrics">
            <div className="tx-context-metric">
              <span>Realized P&L</span>
              <strong style={{ color: historySummary.realizedPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {historySummary.realizedPnl >= 0 ? '+' : '-'}${Math.abs(historySummary.realizedPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="tx-context-metric">
              <span>Holdings</span>
              <strong>${historySummary.holdingsValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="tx-context-metric">
              <span>Gas</span>
              <strong>{historySummary.gasPls.toLocaleString('en-US', { maximumFractionDigits: 4 })} PLS</strong>
            </div>
          </div>
          <button type="button" className="tx-context-clear" onClick={() => setTxAssetFilter('all')}>
            Clear filter <X size={12} />
          </button>
        </div>
      )}

      <div className="transaction-ledger-shell transaction-ledger-shell--dense">
        <div className="tx-context-band">
          <div className="tx-band-chip-group">
            <span className="tx-band-chip tx-band-chip--accent">Swaps only</span>
            <span className="tx-band-chip">{selectedWalletAddr === 'all' ? 'All wallets' : shortenAddr(selectedWalletAddr)}</span>
            <span className="tx-band-chip">{txAssetFilter === 'all' ? 'All tokens' : txAssetFilter}</span>
          </div>
          <div className="tx-band-metrics">
            <div className="tx-band-metric">
              <span>Swaps</span>
              <strong>{filteredTransactions.length}</strong>
            </div>
            <div className="tx-band-metric">
              <span>Realized P&L</span>
              <strong style={{ color: historySummary.realizedPnl >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {historySummary.realizedPnl >= 0 ? '+' : '-'}${Math.abs(historySummary.realizedPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="tx-band-metric">
              <span>Holdings</span>
              <strong>${historySummary.holdingsValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="tx-band-metric">
              <span>Gas total</span>
              <strong>{historySummary.gasPls.toLocaleString('en-US', { maximumFractionDigits: 4 })} PLS</strong>
              <small>${historySummary.gasUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</small>
            </div>
          </div>
        </div>

        <div className="transaction-ledger-toolbar transaction-ledger-toolbar--dense">
          <div className="transaction-ledger-title">
            <History size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div>
              <strong>Swap Ledger</strong>
              <span>Dense PulseX-style execution history for PulseChain swaps.</span>
            </div>
          </div>
          <span className="transaction-ledger-badge">PulseChain</span>
        </div>

        <div className="transaction-ledger-filters history-filter-row">
          {([
            { id: 'asset', label: 'Token Scope', value: txAssetFilter, onChange: setTxAssetFilter, options: swapAssetFilterOptions },
            { id: 'year', label: 'Execution Year', value: txYearFilter, onChange: setTxYearFilter, options: swapYearFilterOptions },
            { id: 'category', label: 'Coin Family', value: txCoinCategory, onChange: setTxCoinCategory, options: [['all','All Coins'],['stablecoins','Stablecoins'],['eth_weth','ETH/WETH'],['hex','HEX/eHEX'],['pls_wpls','PLS/WPLS'],['bridged','Bridged']] as [string,string][] },
          ]).map(({ id, label, value, onChange, options }) => (
            <label key={id} className="history-filter-control">
              <span>{label}</span>
              <select value={value} onChange={e => onChange(e.target.value)}
                className="history-filter-select"
                aria-label={label}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          ))}
          <button
            type="button"
            onClick={() => { setTxAssetFilter('all'); setTxYearFilter('all'); setTxCoinCategory('all'); }}
            className="history-clear-btn"
            disabled={!hasActiveSwapFilters}
          >
            Clear all
          </button>
        </div>

        <div className="transaction-ledger-list custom-scrollbar">
          <TransactionList
            transactions={filteredTransactions}
            viewAsYou={viewAsYou}
            wallets={wallets}
            compact={txCompact}
            assets={currentAssets}
            getTokenLogoUrl={getTokenLogoUrl}
            tokenLogos={tokenLogos}
            hideIds={hiddenTxIds}
            onToggleHide={handleToggleHide}
            showHidden={showHiddenTxs}
            onFilterByAsset={handleFilterByAssetSwap}
            emptyMessage="No swaps found for these filters."
          />
        </div>
      </div>

      {/* -- PLS Flow Summary (merged from former tracker tab) -- */}
      {plsSwapData.rows.length > 0 && (
        <div className="transaction-flow-panel">
          <div className={`overview-panel-header ${isCollapsed('history-pls') ? '' : 'overview-panel-header--divided'}`}>
            <div className="overview-panel-heading">
              <span className="overview-panel-kicker">Native Flow</span>
              <div className="overview-section-title">PLS Flow</div>
              <div className="transaction-flow-subtitle">Net PLS movement across all tracked wallets.</div>
            </div>
            <button
              onClick={() => toggleSection('history-pls')}
              className="overview-panel-toggle"
              aria-label={isCollapsed('history-pls') ? 'Expand PLS flow' : 'Collapse PLS flow'}
              aria-expanded={!isCollapsed('history-pls')}
            >
              {isCollapsed('history-pls') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
          {!isCollapsed('history-pls') && (
            <div className="transaction-flow-grid stat-grid-4">
              {[
                { label: 'PLS Received', val: plsSwapData.totalReceived >= 1e6 ? `${(plsSwapData.totalReceived/1e6).toFixed(2)}M` : plsSwapData.totalReceived.toLocaleString('en-US',{maximumFractionDigits:0}), sub: 'Total inflow', color: t.green },
                { label: 'PLS Spent', val: plsSwapData.totalSpent >= 1e6 ? `${(plsSwapData.totalSpent/1e6).toFixed(2)}M` : plsSwapData.totalSpent.toLocaleString('en-US',{maximumFractionDigits:0}), sub: 'Total outflow', color: t.red },
                { label: 'Net PLS', val: `${plsSwapData.totalNet >= 0 ? '+' : ''}${Math.abs(plsSwapData.totalNet) >= 1e6 ? (plsSwapData.totalNet/1e6).toFixed(2)+'M' : plsSwapData.totalNet.toLocaleString('en-US',{maximumFractionDigits:0})}`, sub: 'Net balance', color: plsSwapData.totalNet >= 0 ? t.green : t.red },
                { label: 'Net USD', val: `${plsSwapData.netUsd >= 0 ? '+' : ''}$${Math.abs(plsSwapData.netUsd).toLocaleString('en-US',{maximumFractionDigits:0})}`, sub: `@ $${(plsSwapData.plsPrice||0).toFixed(6)}/PLS`, color: plsSwapData.netUsd >= 0 ? t.green : t.red },
              ].map(({ label, val, sub, color }) => (
                <div key={label} className="transaction-flow-card">
                  <div className="transaction-flow-label">{label}</div>
                  <div className="transaction-flow-value" style={{ color }}>{val}</div>
                  <div className="transaction-flow-copy">{sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
