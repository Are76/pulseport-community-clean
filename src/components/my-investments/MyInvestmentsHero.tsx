interface MyInvestmentsHeroProps {
  investedFiat: number;
  currentValue: number;
  pnlUsd: number;
  pnlPercent: number;
  liquidValue: number;
  stakedValue: number;
}

const formatUsd = (value: number) => `$${value.toLocaleString('en-US')}`;
const formatSignedUsd = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US')}`;
const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export function MyInvestmentsHero(props: MyInvestmentsHeroProps) {
  const pnlTone = props.pnlUsd >= 0 ? 'stat-value--positive' : 'stat-value--negative';

  return (
    <section className="card card--spacious" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p className="stat-label">Invested Fiat</p>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--fg)', margin: 0 }}>{formatUsd(props.investedFiat)}</h1>
        <p style={{ fontSize: '14px', color: 'var(--fg-muted)', margin: 0 }}>Historical entry pricing from Ethereum and Base inflows.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="stats-grid" style={{ minWidth: '300px' }}>
          <article className="stat">
            <span className="stat-label">Current Value</span>
            <strong className="stat-value">{formatUsd(props.currentValue)}</strong>
          </article>
          <article className="stat">
            <span className="stat-label">Net P&amp;L</span>
            <strong className={`stat-value ${pnlTone}`}>{formatSignedUsd(props.pnlUsd)}</strong>
            <span className="stat-subtext">{formatSignedPercent(props.pnlPercent)}</span>
          </article>
          <article className="stat">
            <span className="stat-label">Liquid</span>
            <strong className="stat-value">{formatUsd(props.liquidValue)}</strong>
          </article>
          <article className="stat">
            <span className="stat-label">Staked</span>
            <strong className="stat-value">{formatUsd(props.stakedValue)}</strong>
          </article>
        </div>
      </div>
    </section>
  );
}

export type { MyInvestmentsHeroProps };
