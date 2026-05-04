import type { ReactNode } from 'react';

type MetricCardProps = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  accent?: ReactNode;
};

export function MetricCard({ label, value, detail, accent }: MetricCardProps) {
  return (
    <article className="app-shell__metric-card">
      <p className="app-shell__metric-card-label">{label}</p>
      <p className="app-shell__metric-card-value">{value}</p>
      {detail && <p className="app-shell__metric-card-detail">{detail}</p>}
      {accent && <div className="app-shell__metric-card-accent">{accent}</div>}
    </article>
  );
}
