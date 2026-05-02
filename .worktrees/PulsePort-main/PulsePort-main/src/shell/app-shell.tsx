import type { PropsWithChildren, ReactNode } from 'react';
import { AppHeader } from './app-header';
import { AppNav } from './app-nav';
import type { ShellView } from './shell-types';
import './shell-layout.css';

type AppShellProps = PropsWithChildren<{
  title: string;
  activeView: ShellView;
  onNavigate: (view: ShellView) => void;
  commandBar?: ReactNode;
}>;

export function AppShell({ children, title, activeView, onNavigate, commandBar }: AppShellProps) {
  return (
    <div className="app-shell" data-shell-root="executive">
      <aside className="app-shell__sidebar">
        <AppNav activeView={activeView} onNavigate={onNavigate} />
      </aside>
      <main className="app-shell__content">
        <AppHeader title={title} />
        <section aria-label="Command bar" className="app-shell__command-bar">
          {commandBar}
        </section>
        <section className="app-shell__page">
          <div className="app-shell__page-body">{children}</div>
        </section>
      </main>
    </div>
  );
}
