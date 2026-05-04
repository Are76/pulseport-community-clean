import { SectionFrame } from '../dashboard-shell';
import type { Asset, InvestmentHoldingRow, Transaction } from '../../types';

type StrategyBoardProps = {
  investmentRows: InvestmentHoldingRow[];
  currentAssets: Asset[];
  currentTransactions: Transaction[];
};

function formatUsd(value: number, maximumFractionDigits = 0) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits })}`;
}

export function StrategyBoard({
  investmentRows,
  currentAssets,
  currentTransactions,
}: StrategyBoardProps) {
  const largestUnrealized = [...investmentRows].sort((a, b) => b.pnlUsd - a.pnlUsd)[0];
  const largestDrawdown = [...investmentRows].sort((a, b) => a.pnlUsd - b.pnlUsd)[0];
  const offChainCapital = currentAssets
    .filter((asset) => asset.chain === 'ethereum' || asset.chain === 'base')
    .reduce((sum, asset) => sum + asset.value, 0);
  const latestTransaction = [...currentTransactions].sort((a, b) => b.timestamp - a.timestamp)[0];

  const strategyRows = [
    {
      label: 'Best unrealized setup',
      title: largestUnrealized ? `${largestUnrealized.symbol} is carrying the strongest open gain.` : 'Waiting for position history.',
      detail: largestUnrealized
        ? `${formatUsd(largestUnrealized.pnlUsd)} against a ${formatUsd(largestUnrealized.costBasis)} cost basis.`
        : 'Import wallets to compare live value against attributed cost basis.',
    },
    {
      label: 'Largest drag',
      title: largestDrawdown ? `${largestDrawdown.symbol} is the biggest open drawdown.` : 'No drawdown signal yet.',
      detail: largestDrawdown
        ? `${formatUsd(Math.abs(largestDrawdown.pnlUsd))} away from cost basis at ${largestDrawdown.pnlPercent.toFixed(1)}%.`
        : 'This board will surface the weakest cost-basis setup once data lands.',
    },
    {
      label: 'Capital staging',
      title: offChainCapital > 0 ? `${formatUsd(offChainCapital)} still sits off PulseChain.` : 'Most visible capital is already on PulseChain.',
      detail: latestTransaction
        ? `Latest flow: ${latestTransaction.type} ${latestTransaction.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${latestTransaction.asset}.`
        : 'Recent transaction flow will appear here once synced.',
    },
  ];

  return (
    <SectionFrame
      title="Strategy Board"
      description="Translate current cost basis, open gains, and recent flow into the next portfolio conversation."
    >
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {strategyRows.map((row) => (
          <article
            key={row.label}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 20,
              display: 'grid',
              gap: 10,
              minHeight: 180,
              alignContent: 'start',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--fg-muted)' }}>
              {row.label}
            </span>
            <strong style={{ fontSize: 18, color: 'var(--fg)' }}>{row.title}</strong>
            <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>{row.detail}</p>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}
