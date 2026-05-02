import { ArrowRight, History, TrendingUp } from 'lucide-react';
import { MetricCard, SectionFrame } from '../dashboard-shell';
import type { Asset, PortfolioSummary } from '../../types';

type CoreActionBoardProps = {
  summary: PortfolioSummary & {
    liquidValue: number;
    stakingValueUsd: number;
  };
  topHolding?: Asset;
  hasInvestmentHistory: boolean;
  onOpenInvestments: () => void;
  onOpenTransactions: () => void;
  onOpenProfitPlanner: () => void;
};

function formatUsd(value: number, maximumFractionDigits = 0) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits })}`;
}

export function CoreActionBoard({
  summary,
  topHolding,
  hasInvestmentHistory,
  onOpenInvestments,
  onOpenTransactions,
  onOpenProfitPlanner,
}: CoreActionBoardProps) {
  const pnlPercent = summary.netInvestment > 0
    ? `${summary.unifiedPnl >= 0 ? '+' : '-'}${Math.abs((summary.unifiedPnl / summary.netInvestment) * 100).toFixed(1)}%`
    : 'Awaiting inflow history';

  return (
    <SectionFrame
      title="Core Action Board"
      description="Start from the highest-leverage actions: inspect holdings, review transaction flow, or pressure-test realized and unrealized gains."
      actions={(
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary front-primary-action" onClick={onOpenInvestments}>
            My Investments <ArrowRight size={15} />
          </button>
          <button type="button" className="btn-ghost front-secondary-action" onClick={onOpenTransactions}>
            Transactions <History size={14} />
          </button>
          <button type="button" className="btn-ghost front-secondary-action" onClick={onOpenProfitPlanner}>
            Profit Planner <TrendingUp size={14} />
          </button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 1fr)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--bg-surface) 82%, transparent))',
              border: '1px solid var(--accent-border)',
              borderRadius: 18,
              padding: 20,
              display: 'grid',
              gap: 14,
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--fg-muted)' }}>
                Executive value
              </span>
              <strong style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 1, color: 'var(--fg)' }}>
                {formatUsd(summary.totalValue)}
              </strong>
              <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
                {hasInvestmentHistory
                  ? `${formatUsd(Math.abs(summary.netInvestment))} invested capital mapped from Ethereum and stablecoin inflows.`
                  : 'Add wallet history to map invested fiat against the current board.'}
              </p>
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <MetricCard
                label="Net P&L"
                value={hasInvestmentHistory ? `${summary.unifiedPnl >= 0 ? '+' : '-'}${formatUsd(Math.abs(summary.unifiedPnl)).slice(1)}` : '-'}
                detail={pnlPercent}
              />
              <MetricCard
                label="24h move"
                value={`${summary.pnl24h >= 0 ? '+' : '-'}${formatUsd(Math.abs(summary.pnl24h)).slice(1)}`}
                detail={`${summary.pnl24h >= 0 ? '+' : '-'}${Math.abs(summary.pnl24hPercent).toFixed(2)}%`}
              />
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 20,
              display: 'grid',
              gap: 12,
              alignContent: 'start',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--fg-muted)' }}>
              Board focus
            </span>
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ fontSize: 18, color: 'var(--fg)' }}>
                {topHolding ? `${topHolding.symbol} is the largest live position` : 'Waiting for portfolio data'}
              </strong>
              <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
                {topHolding
                  ? `${formatUsd(topHolding.value)} currently anchors the book across ${topHolding.chain}.`
                  : 'The executive layer will rank positions once holdings are available.'}
              </p>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <MetricCard label="Liquid capital" value={formatUsd(summary.liquidValue)} />
              <MetricCard label="Active staking" value={formatUsd(summary.stakingValueUsd)} />
            </div>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
