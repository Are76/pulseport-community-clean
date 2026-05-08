import type { InvestmentHoldingRow } from '../../types';

interface MyInvestmentsAssetPanelProps {
  row: InvestmentHoldingRow;
  onClose: () => void;
  onOpenTransactions: (row: InvestmentHoldingRow) => void;
}

const formatUsd = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function MyInvestmentsAssetPanel({ row, onClose, onOpenTransactions }: MyInvestmentsAssetPanelProps) {
  const pnlTone = row.pnlUsd >= 0 ? 'stat-value--positive' : 'stat-value--negative';

  // Mobile-first responsive: full-screen on mobile, right sidebar on desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    right: isDesktop ? 0 : 'auto',
    top: isDesktop ? 0 : '64px',
    bottom: 0,
    left: isDesktop ? 'auto' : 0,
    width: isDesktop ? '450px' : '100%',
    background: 'var(--bg-void)',
    borderLeft: isDesktop ? '1px solid var(--border)' : 'none',
    borderTop: !isDesktop ? '1px solid var(--border)' : 'none',
    boxShadow: isDesktop ? '-4px 0 12px rgba(0,0,0,0.15)' : 'none',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
  } as const;
  return (
    <aside style={sidebarStyle} aria-label={`${row.symbol} details`}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="stat-label" style={{ marginBottom: '0.5rem' }}>Holdings Detail</p>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 0.25rem' }}>{row.symbol}</h2>
          <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>{row.name} | {row.chain}</p>
        </div>
        <button type="button" style={{ background: 'none', border: 'none', fontSize: '14px', color: 'var(--fg-muted)', cursor: 'pointer', padding: '0.5rem', textDecoration: 'underline' }} onClick={onClose}>Close</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <article className="stat">
            <span className="stat-label">Current Value</span>
            <strong className="stat-value">{formatUsd(row.currentValue)}</strong>
          </article>
          <article className="stat">
            <span className="stat-label">Cost Basis</span>
            <strong className="stat-value">{formatUsd(row.costBasis)}</strong>
          </article>
          <article className="stat">
            <span className="stat-label">Net P&amp;L</span>
            <strong className={`stat-value ${pnlTone}`}>{row.pnlUsd >= 0 ? '+' : '-'}${Math.abs(row.pnlUsd).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
          </article>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span className="stat-label">Investment Path</span>
          <p style={{ fontSize: '14px', color: 'var(--fg)', margin: '0.5rem 0 0' }}>{row.routeSummary}</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button type="button" style={{ width: '100%', padding: '0.75rem', background: 'var(--shell-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }} onClick={() => onOpenTransactions(row)}>
          View Full Transactions
        </button>
      </div>
    </aside>
  );
}

export type { MyInvestmentsAssetPanelProps };
