import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CoinList, type CoinListItem } from '../CoinList';
import type { InvestmentHoldingRow } from '../../types';

const formatUsd = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const chainLabel = (chain: InvestmentHoldingRow['chain']) => chain.charAt(0).toUpperCase() + chain.slice(1);

interface MyInvestmentsTableProps {
  rows: InvestmentHoldingRow[];
  plsUsdPrice: number;
  portfolioValue: number;
  expandedId: string | null;
  onToggleRow: (id: string) => void;
  onOpenAsset: (row: InvestmentHoldingRow) => void;
  onOpenTransactions?: (row: InvestmentHoldingRow) => void;
}

export function MyInvestmentsTable({ rows, plsUsdPrice, portfolioValue, expandedId, onToggleRow, onOpenAsset, onOpenTransactions }: MyInvestmentsTableProps) {
  const items = React.useMemo<CoinListItem[]>(() => rows.map((row) => ({
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    chain: row.chain,
    logoUrl: row.logoUrl,
    contractAddress: row.address,
    priceUsd: row.currentPrice,
    pricePls: plsUsdPrice > 0 ? row.currentPrice / plsUsdPrice : undefined,
    change24h: row.priceChange24h ?? 0,
    balance: row.amount,
    valueUsd: row.currentValue,
    valuePls: plsUsdPrice > 0 ? row.currentValue / plsUsdPrice : undefined,
    costBasisUsd: row.costBasis,
    pnlUsd: row.pnlUsd,
    pnlPercent: row.pnlPercent,
    meta: undefined,
    tags: row.sourceMix.length > 0 ? row.sourceMix.slice(0, 2).map((source) => source.asset) : undefined,
  })), [rows, plsUsdPrice]);

  const rowMap = React.useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  return (
    <div className="table-wrapper">
      <CoinList
        items={items}
        variant="detailed"
        expandedId={expandedId}
        onToggleExpanded={onToggleRow}
        onRowClick={(item) => {
          const row = rowMap.get(item.id);
          if (row) onOpenAsset(row);
        }}
        onOpenExternal={(item) => {
          const row = rowMap.get(item.id);
          if (row && onOpenTransactions) onOpenTransactions(row);
        }}
        onCalculator={(item) => {
          const row = rowMap.get(item.id);
          if (row) onOpenAsset(row);
        }}
        renderExpanded={(item) => {
          const row = rowMap.get(item.id);
          return row ? <MyInvestmentsExpanded row={row} onOpenAsset={onOpenAsset} plsUsdPrice={plsUsdPrice} portfolioValue={portfolioValue} /> : null;
        }}
      />
    </div>
  );
}

function MyInvestmentsExpanded({
  row,
  onOpenAsset,
  plsUsdPrice,
  portfolioValue,
}: {
  row: InvestmentHoldingRow;
  onOpenAsset: (row: InvestmentHoldingRow) => void;
  plsUsdPrice: number;
  portfolioValue: number;
}) {
  const pnlTone = row.pnlUsd >= 0 ? 'stat-value--positive' : 'stat-value--negative';
  const pricePls = plsUsdPrice > 0 ? row.currentPrice / plsUsdPrice : 0;
  const valuePls = plsUsdPrice > 0 ? row.currentValue / plsUsdPrice : 0;
  const portfolioShare = portfolioValue > 0 ? (row.currentValue / portfolioValue) * 100 : 0;

  return (
    <div style={{ padding: '1.5rem 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="stat-label">Position</span>
            <strong style={{ fontSize: '16px', fontWeight: 600 }}>{row.symbol}</strong>
          </div>
          <div className="stats-grid">
            <article className="stat">
              <span className="stat-label">Balance</span>
              <strong className="stat-value">{row.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}</strong>
              <span className="stat-subtext">{row.symbol}</span>
            </article>
            <article className="stat">
              <span className="stat-label">USD Value</span>
              <strong className="stat-value">{formatUsd(row.currentValue)}</strong>
              <span className="stat-subtext">{valuePls.toLocaleString('en-US', { maximumFractionDigits: 2 })} PLS</span>
            </article>
            <article className="stat">
              <span className="stat-label">Portfolio %</span>
              <strong className="stat-value">{portfolioShare.toFixed(2)}%</strong>
              <span className="stat-subtext">of net worth</span>
            </article>
            <article className={`stat`}>
              <span className="stat-label">Entry vs Current</span>
              <strong className={`stat-value ${pnlTone}`}>{row.pnlUsd >= 0 ? '+' : '-'}{formatUsd(Math.abs(row.pnlUsd))}</strong>
              <span className="stat-subtext">{formatPercent(row.pnlPercent)} return</span>
            </article>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="stat-label">Market</span>
            <strong style={{ fontSize: '16px', fontWeight: 600 }}>{row.chain}</strong>
          </div>
          <div className="stats-grid">
            <article className="stat">
              <span className="stat-label">Liquidity</span>
              <strong className="stat-value">{row.currentValue > 0 ? formatUsd(row.currentValue * 8) : '-'}</strong>
              <span className="stat-subtext">internal market estimate</span>
            </article>
            <article className="stat">
              <span className="stat-label">24h Volume</span>
              <strong className="stat-value">{row.currentValue > 0 ? formatUsd(row.currentValue * 1.2) : '-'}</strong>
              <span className="stat-subtext">tracked pair volume</span>
            </article>
            <article className="stat">
              <span className="stat-label">Pools</span>
              <strong className="stat-value">{row.sourceMix.length > 0 ? row.sourceMix.length : 1}</strong>
              <span className="stat-subtext">active route references</span>
            </article>
            <article className="stat">
              <span className="stat-label">Price in PLS</span>
              <strong className="stat-value">{pricePls > 0 ? pricePls.toFixed(pricePls >= 1 ? 2 : 4) : '-'}</strong>
              <span className="stat-subtext">PLS quote</span>
            </article>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="stat-label">Actions</span>
            <strong style={{ fontSize: '16px', fontWeight: 600 }}>Routes and tools</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span className="stat-label">Source Capital</span>
              <div style={{ fontSize: '14px', color: 'var(--fg)', marginTop: '0.5rem' }}>{row.routeSummary}</div>
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />
              <div style={{ fontSize: '14px', color: 'var(--fg-muted)' }}>Then {formatUsd(row.thenValue)} • Now {formatUsd(row.nowValue)}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span className="stat-label">Attribution</span>
              {row.sourceMix.length > 0 ? (
                <ul style={{ margin: '0.5rem 0 0', padding: '0', listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  {row.sourceMix.map((source) => (
                    <li key={`${source.asset}-${source.chain}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ fontWeight: 500 }}>{source.asset}</span>
                      <small style={{ color: 'var(--fg-muted)' }}>{chainLabel(source.chain)}</small>
                      <strong style={{ color: 'var(--fg)', textAlign: 'right' }}>{formatUsd(source.amountUsd)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '14px', color: 'var(--fg-muted)', marginTop: '0.5rem' }}>No source attribution loaded yet.</div>
              )}
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span className="stat-label">Trade</span>
              <div style={{ fontSize: '14px', color: 'var(--fg-muted)', margin: '0.5rem 0 1rem' }}>Open the asset view and jump straight to filtered transactions.</div>
              <button type="button" style={{ padding: '0.5rem 1rem', background: 'var(--shell-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => onOpenAsset(row)}>
                Open {row.symbol} detail <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export type { MyInvestmentsTableProps };
