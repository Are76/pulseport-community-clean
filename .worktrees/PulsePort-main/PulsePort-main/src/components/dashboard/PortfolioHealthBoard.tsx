import { SectionFrame } from '../dashboard-shell';
import type { Asset, Chain, PortfolioSummary } from '../../types';

type ChainRow = {
  chain: Chain;
  value: number;
};

type PortfolioHealthBoardProps = {
  summary: PortfolioSummary;
  topHoldings: Asset[];
  chainRows: ChainRow[];
  unpricedCount: number;
};

function formatUsd(value: number, maximumFractionDigits = 0) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits })}`;
}

export function PortfolioHealthBoard({
  summary,
  topHoldings,
  chainRows,
  unpricedCount,
}: PortfolioHealthBoardProps) {
  return (
    <SectionFrame
      title="Portfolio Health Board"
      description="Read concentration, chain exposure, and pricing coverage before making allocation changes."
    >
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, .8fr)' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 20,
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--fg)', fontSize: 18 }}>Top positions</strong>
            <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Largest holdings by current value</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {topHoldings.slice(0, 5).map((asset) => {
              const share = summary.totalValue > 0 ? (asset.value / summary.totalValue) * 100 : 0;
              return (
                <div key={`${asset.chain}:${asset.id}`} style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <strong style={{ color: 'var(--fg)' }}>{asset.symbol}</strong>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>{asset.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'grid', gap: 2 }}>
                      <strong style={{ color: 'var(--fg)' }}>{formatUsd(asset.value)}</strong>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>{share.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--fg-muted) 12%, transparent)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(6, share))}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 48%, white))',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 20,
              display: 'grid',
              gap: 12,
            }}
          >
            <strong style={{ color: 'var(--fg)', fontSize: 18 }}>Chain mix</strong>
            {chainRows.map((row) => {
              const share = summary.totalValue > 0 ? (row.value / summary.totalValue) * 100 : 0;
              return (
                <div key={row.chain} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: 'var(--fg)' }}>{row.chain.charAt(0).toUpperCase() + row.chain.slice(1)}</span>
                    <span style={{ color: 'var(--fg-muted)' }}>{share.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--fg-muted) 12%, transparent)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(4, share))}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 35%, transparent))',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 20,
              display: 'grid',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--fg-muted)' }}>
              Coverage
            </span>
            <strong style={{ color: 'var(--fg)', fontSize: 18 }}>
              {unpricedCount === 0 ? 'All visible holdings are priced.' : `${unpricedCount} holding${unpricedCount === 1 ? '' : 's'} still need market pricing.`}
            </strong>
            <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
              Pricing coverage directly affects valuation accuracy and the executive view above.
            </p>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
