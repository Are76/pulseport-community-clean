import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ContextActionStrip, InsightRail, MetricCard, PageHero, SectionFrame } from '../components/dashboard-shell';
import type { Asset, InvestmentHoldingRow, Transaction } from '../types';

interface WalletAnalyzerPageProps {
  investedFiat: number;
  totalValue: number;
  liquidValue: number;
  stakedValue: number;
  rows: InvestmentHoldingRow[];
  assets: Asset[];
  transactions: Transaction[];
  onOpenPlanner: () => void;
  onOpenTransactions: () => void;
  onInspectHolding: (row: InvestmentHoldingRow) => void;
}

const usd = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: value >= 100 ? 0 : 2 })}`;

const signedUsd = (value: number) =>
  `${value >= 0 ? '+' : '-'}${usd(Math.abs(value))}`;

const signedPct = (value: number) => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`;

const chainLabel = (chain: Asset['chain']) => {
  if (chain === 'pulsechain') return 'PulseChain';
  if (chain === 'ethereum') return 'Ethereum';
  return 'Base';
};

const transactionLabel = (tx: Transaction) => {
  if (tx.type === 'swap' && tx.counterAsset) {
    return `${tx.counterAsset} -> ${tx.asset}`;
  }

  return `${tx.type[0].toUpperCase()}${tx.type.slice(1)} ${tx.asset}`;
};

export function WalletAnalyzerPage({
  investedFiat,
  totalValue,
  liquidValue,
  stakedValue,
  rows,
  assets,
  transactions,
  onOpenPlanner,
  onOpenTransactions,
  onInspectHolding,
}: WalletAnalyzerPageProps) {
  const pnlUsd = totalValue - investedFiat;
  const pnlPercent = investedFiat > 0 ? (pnlUsd / investedFiat) * 100 : 0;
  const topRows = React.useMemo(() => [...rows].sort((left, right) => right.currentValue - left.currentValue).slice(0, 3), [rows]);
  const latestTransactions = React.useMemo(
    () => [...transactions].sort((left, right) => right.timestamp - left.timestamp).slice(0, 4),
    [transactions],
  );
  const chainExposure = React.useMemo(() => {
    const totals = new Map<Asset['chain'], { chain: Asset['chain']; value: number; count: number }>();

    for (const asset of assets) {
      const current = totals.get(asset.chain) ?? { chain: asset.chain, value: 0, count: 0 };
      current.value += asset.value;
      current.count += 1;
      totals.set(asset.chain, current);
    }

    return [...totals.values()].sort((left, right) => right.value - left.value);
  }, [assets]);
  const recentFlowUsd = React.useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    return transactions.reduce((sum, tx) => {
      if (tx.timestamp < sevenDaysAgo) return sum;
      return sum + (tx.valueUsd ?? 0);
    }, 0);
  }, [transactions]);

  const highestConviction = topRows[0] ?? null;
  const dominantChain = chainExposure[0] ?? null;
  const capitalPrompt = pnlUsd >= 0 ? 'Protect the lead' : 'Repair the basis';
  const capitalPromptCopy = highestConviction
    ? `${highestConviction.symbol} still anchors the book at ${usd(highestConviction.currentValue)}. Review whether this is deliberate concentration or drift.`
    : 'Add wallet history to unlock a stronger conviction read.';
  const flowPrompt = recentFlowUsd >= 0 ? 'Capital expanded' : 'Capital rotated out';
  const flowPromptCopy = `${signedUsd(recentFlowUsd)} over the last 7 days across ${transactions.length} tracked movements.`;

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Capital command"
        title="Wallet Analyzer"
        description="Use the current book, recent flows, and concentrated positions to decide the next portfolio action without leaving the executive shell."
        actions={(
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenPlanner}
              className="header-action-btn"
              aria-label="Open profit planner"
            >
              <Sparkles size={14} />
              <span>Open Profit Planner</span>
            </button>
            <button
              type="button"
              onClick={onOpenTransactions}
              className="header-action-btn"
              aria-label="Review transactions"
            >
              <ArrowRight size={14} />
              <span>Review Transactions</span>
            </button>
          </div>
        )}
      />

      <div className="wa-page-layout">
        <div className="wa-page-main">
          <ContextActionStrip title="What needs action now">
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              <MetricCard
                label={capitalPrompt}
                value={highestConviction ? highestConviction.symbol : 'No anchor yet'}
                detail={capitalPromptCopy}
              />
              <MetricCard
                label="Dominant chain"
                value={dominantChain ? chainLabel(dominantChain.chain) : 'No chain exposure'}
                detail={dominantChain ? `${usd(dominantChain.value)} across ${dominantChain.count} tracked assets` : 'Waiting for chain inventory'}
              />
              <MetricCard
                label={flowPrompt}
                value={usd(recentFlowUsd)}
                detail={flowPromptCopy}
              />
            </div>
          </ContextActionStrip>

          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <MetricCard
              label="Total value"
              value={usd(totalValue)}
              detail={`${usd(liquidValue)} liquid / ${usd(stakedValue)} staked`}
            />
            <MetricCard
              label="Tracked capital"
              value={investedFiat > 0 ? usd(investedFiat) : 'No tracked basis'}
              detail={investedFiat > 0 ? `${signedUsd(pnlUsd)} vs capital deployed` : 'Waiting for ETH or stablecoin inflows'}
            />
            <MetricCard
              label="Net P&L"
              value={investedFiat > 0 ? signedUsd(pnlUsd) : '$0'}
              detail={investedFiat > 0 ? signedPct(pnlPercent) : 'Insufficient basis history'}
            />
            <MetricCard
              label="7 day flow"
              value={usd(recentFlowUsd)}
              detail={`${transactions.length} tracked movements`}
            />
          </div>

          <SectionFrame
            title="Highest conviction"
            description="Largest current positions with direct handoff into the transaction ledger."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {topRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onInspectHolding(row)}
                  className="header-action-btn"
                  aria-label={`Inspect ${row.symbol}`}
                  style={{
                    alignItems: 'stretch',
                    display: 'grid',
                    gap: 8,
                    justifyItems: 'stretch',
                    padding: 16,
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <strong style={{ color: 'var(--fg)', display: 'block' }}>{row.symbol}</strong>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>{row.routeSummary}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--fg)', display: 'block' }}>{usd(row.currentValue)}</strong>
                      <span style={{ color: row.pnlUsd >= 0 ? 'var(--positive)' : 'var(--negative)', fontSize: 13 }}>
                        {signedUsd(row.pnlUsd)} · {signedPct(row.pnlPercent)}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--fg-subtle)', fontSize: 12 }}>
                    Cost basis {usd(row.costBasis)} · {chainLabel(row.chain)}
                  </div>
                </button>
              ))}
            </div>
          </SectionFrame>

          <SectionFrame
            title="Latest movement"
            description="Recent ledger events already loaded in the portfolio session."
            actions={(
              <button type="button" onClick={onOpenTransactions} className="header-action-btn">
                Open ledger
              </button>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {latestTransactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    alignItems: 'center',
                    display: 'grid',
                    gap: 8,
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--fg)', display: 'block' }}>{transactionLabel(tx)}</strong>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>
                      {chainLabel(tx.chain)} · {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <strong style={{ color: 'var(--fg)' }}>{usd(tx.valueUsd ?? 0)}</strong>
                </div>
              ))}
            </div>
          </SectionFrame>
        </div>

        <InsightRail title="Decision support">
          <div style={{ display: 'grid', gap: 12 }}>
            <SectionFrame
              title="Capital deployment"
              description="Current book concentration by chain using the live asset set already in memory."
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {chainExposure.map((entry) => (
                  <div
                    key={entry.chain}
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--fg)', display: 'block' }}>{chainLabel(entry.chain)}</strong>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>{entry.count} tracked assets</span>
                    </div>
                    <strong style={{ color: 'var(--fg)' }}>{usd(entry.value)}</strong>
                  </div>
                ))}
              </div>
            </SectionFrame>

            <SectionFrame
              title="Next move"
              description="Take the next portfolio action without leaving the analyzer."
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <button type="button" onClick={onOpenPlanner} className="header-action-btn">
                  Open Profit Planner
                </button>
                <button type="button" onClick={onOpenTransactions} className="header-action-btn">
                  Review transactions
                </button>
                {highestConviction && (
                  <button
                    type="button"
                    onClick={() => onInspectHolding(highestConviction)}
                    className="header-action-btn"
                    aria-label={`Inspect ${highestConviction.symbol} from decision rail`}
                  >
                    Inspect {highestConviction.symbol}
                  </button>
                )}
              </div>
            </SectionFrame>
          </div>
        </InsightRail>
      </div>
    </div>
  );
}

export type { WalletAnalyzerPageProps };
