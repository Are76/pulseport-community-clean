import type { PropsWithChildren, ReactNode } from 'react';

export type AppShellNavigationItem = {
  id: string;
  label: string;
  shortLabel?: string;
};

export type AppShellNavigationGroup = {
  label: string;
  items: AppShellNavigationItem[];
};

type AppShellProps = PropsWithChildren<{
  navigationGroups: AppShellNavigationGroup[];
  activeNavigationId?: string;
  onNavigate?: (id: string) => void;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  commandBar?: ReactNode;
  pageHero?: ReactNode;
  contextActionStrip?: ReactNode;
  insightRail?: ReactNode;
  sidebarClassName?: string;
  contentClassName?: string;
  pageClassName?: string;
  pageBodyClassName?: string;
}>;

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AppShell({
  children,
  navigationGroups,
  activeNavigationId,
  onNavigate,
  sidebarHeader,
  sidebarFooter,
  commandBar,
  pageHero,
  contextActionStrip,
  insightRail,
  sidebarClassName,
  contentClassName,
  pageClassName,
  pageBodyClassName,
}: AppShellProps) {
  return (
    <div className="app-shell" data-shell-root="executive">
      <aside className={joinClasses('app-shell__sidebar', sidebarClassName)}>
        {sidebarHeader ?? (
          <div className="app-shell__brand">
            <div className="app-shell__brand-mark" aria-hidden="true">
              P
            </div>
            <div className="app-shell__brand-copy">
              <p className="app-shell__brand-eyebrow">PulsePort command deck</p>
              <strong className="app-shell__brand-wordmark">PulsePort</strong>
              <p className="app-shell__brand-caption">Executive cockpit</p>
            </div>
          </div>
        )}
        <nav aria-label="Primary" className="app-shell__nav">
          {navigationGroups.map(group => (
            <div key={group.label} className="app-shell__nav-group">
              <p className="app-shell__nav-group-label">{group.label}</p>
              <div className="app-shell__nav-group-items">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="app-shell__nav-item"
                    aria-pressed={item.id === activeNavigationId}
                    aria-current={item.id === activeNavigationId ? 'page' : undefined}
                    onClick={() => onNavigate?.(item.id)}
                  >
                    <span className="app-shell__nav-label">{item.label}</span>
                    {item.shortLabel && <span className="app-shell__nav-short">{item.shortLabel}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {sidebarFooter}
      </aside>
      <main className={joinClasses('app-shell__content', contentClassName)}>
        {commandBar}
        {pageHero}
        {contextActionStrip}
        <section className={joinClasses('app-shell__page', pageClassName)}>
          <div className={joinClasses('app-shell__page-body', pageBodyClassName)}>{children}</div>
          {insightRail}
        </section>
      </main>
    </div>
  );
}
