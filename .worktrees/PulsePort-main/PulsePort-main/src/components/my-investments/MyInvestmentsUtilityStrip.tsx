interface MyInvestmentsUtilityStripProps {
  swapPnl24hUsd: number;
  swapCount24h: number;
  trackedMarkets: number;
  onOpenMarketWatch: () => void;
  onOpenPlanner: () => void;
  onOpenTransactions: () => void;
}

const formatUsd = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function MyInvestmentsUtilityStrip(props: MyInvestmentsUtilityStripProps) {
  const pnlTone = props.swapPnl24hUsd >= 0 ? 'is-positive' : 'is-negative';

  return (
    <section className="mi-utility-strip" aria-label="My Investments tools">
      <button type="button" className="mi-utility-card" onClick={props.onOpenMarketWatch}>
        <span className="mi-label">Market Watch</span>
        <strong>Tracked markets</strong>
        <p>Open the live PulseChain market board and scan {props.trackedMarkets} active assets.</p>
        <div className="mi-utility-meta">{props.trackedMarkets} watched</div>
      </button>

      <button type="button" className="mi-utility-card" onClick={props.onOpenPlanner}>
        <span className="mi-label">Profit Planner</span>
        <strong>Plan the next move</strong>
        <p>Work backward from your target and rebalance the current bag without leaving this flow.</p>
        <div className="mi-utility-meta">Portfolio scenarios</div>
      </button>

      <button type="button" className={`mi-utility-card ${pnlTone}`} onClick={props.onOpenTransactions}>
        <span className="mi-label">24H Swap P&amp;L</span>
        <strong>{formatUsd(props.swapPnl24hUsd)}</strong>
        <p>Recent realized movement across PulseChain swaps only.</p>
        <div className="mi-utility-meta">{props.swapCount24h} swap{props.swapCount24h === 1 ? '' : 's'} in the last 24h</div>
      </button>
    </section>
  );
}

export type { MyInvestmentsUtilityStripProps };
