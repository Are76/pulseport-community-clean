import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AppShell, CommandBar, PageHero } from '../components/dashboard-shell';
import { APP_SHELL_NAV_GROUPS } from '../features/app-shell/appShellController';

describe('AppShell redesign foundation', () => {
  it('renders grouped navigation and the page hero through redesign primitives', () => {
    render(
      <AppShell
        navigationGroups={APP_SHELL_NAV_GROUPS}
        activeNavigationId="home"
        onNavigate={() => {}}
        commandBar={
          <CommandBar>
            <button type="button">Open command bar</button>
          </CommandBar>
        }
        pageHero={
          <PageHero
            eyebrow="Leadership view"
            title="Executive cockpit"
            description="A reusable hero surface for future executive pages."
          />
        }
      >
        <div>Page body</div>
      </AppShell>,
    );

    expect(document.querySelector('[data-shell-root="executive"]')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Leadership view')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /executive cockpit/i })).toBeInTheDocument();
    expect(screen.getByText(/reusable hero surface/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /command bar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open command bar/i })).toBeInTheDocument();
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('wires the live app boundary through the redesign shell primitives', () => {
    render(<App />);

    expect(document.querySelector('[data-shell-root="executive"]')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /command bar/i })).toBeInTheDocument();
    expect(screen.getAllByText('PulsePort command deck')).toHaveLength(2);
    expect(screen.getByText('Executive cockpit')).toBeInTheDocument();
    expect(document.querySelector('.app-shell__nav-item[aria-current="page"] .app-shell__nav-label')).toHaveTextContent('Dashboard');
    expect(document.querySelector('.app-shell__page-meta-title')).toHaveTextContent('Dashboard');
    expect(screen.getByText('Current portfolio state across PulseChain, Ethereum, and Base.')).toBeInTheDocument();
  });
});
