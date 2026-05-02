import type { PropsWithChildren, ReactNode } from 'react';

type InsightRailProps = PropsWithChildren<{
  title?: ReactNode;
  label?: string;
}>;

export function InsightRail({ children, title, label = 'Insight rail' }: InsightRailProps) {
  return (
    <aside aria-label={label} className="app-shell__insight-rail">
      {title && <h2 className="app-shell__insight-rail-title">{title}</h2>}
      <div className="app-shell__insight-rail-body">{children}</div>
    </aside>
  );
}
