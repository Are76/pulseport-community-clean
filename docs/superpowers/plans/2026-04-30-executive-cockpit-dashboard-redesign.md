# Executive Cockpit Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign PulsePort into a premium executive portfolio cockpit with a reusable app shell, dual-theme design system, action-first dashboard, redesigned Wallet Analyzer, and consistent visual/interaction language across the core pages.

**Architecture:** Build the redesign as a layered UI system instead of page-local styling. Introduce reusable shell, token, surface, and page-frame primitives first; then migrate flagship pages (`Dashboard`, `Wallet Analyzer`) onto the new system; then upgrade dense truth surfaces (`My Investments`, `Transactions`) without changing their underlying financial logic.

**Tech Stack:** React, TypeScript, Vite, existing app state in `src/App.tsx`, existing feature controllers under `src/features/*`, CSS-based theming, Vitest, Testing Library.

---

## File Structure

### New files

- `src/components/dashboard-shell/AppShell.tsx`
  Global shell wrapper with left rail, top command bar, page framing, and responsive structure.
- `src/components/dashboard-shell/CommandBar.tsx`
  Top bar with wallet scope, search, refresh, theme, and status slots.
- `src/components/dashboard-shell/PageHero.tsx`
  Shared hero wrapper for page title, subtitle, key actions, and stat summaries.
- `src/components/dashboard-shell/SectionFrame.tsx`
  Reusable section header/body wrapper for consistent hierarchy and spacing.
- `src/components/dashboard-shell/MetricCard.tsx`
  Shared executive metric card surface with optional provenance trigger support.
- `src/components/dashboard-shell/InsightRail.tsx`
  Optional side-rail wrapper for alerts and next actions.
- `src/components/dashboard-shell/ContextActionStrip.tsx`
  Action strip for planner, ledger, watchlist, and workflow CTA clusters.
- `src/components/dashboard-shell/index.ts`
  Barrel exports for the shell components.
- `src/components/dashboard/CoreActionBoard.tsx`
  Action-first dashboard module for urgent items and recommended next steps.
- `src/components/dashboard/PortfolioHealthBoard.tsx`
  High-level net worth, allocation, chain exposure, and health summaries.
- `src/components/dashboard/StrategyBoard.tsx`
  Dashboard strategy/opportunity modules including rotation and analyzer prompts.
- `src/components/wallet-analyzer/AnalyzerActionRail.tsx`
  Wallet Analyzer support rail for planner, ledger, and focused next steps.
- `src/styles/tokens.css`
  Light-first dual-theme token layer: color, spacing, radii, borders, elevation.
- `src/styles/layout.css`
  Shared shell layout grids, page widths, breakpoints, and responsive structure.
- `src/styles/surfaces.css`
  Shared card, panel, utility strip, and dense container surface styles.
- `src/styles/motion.css`
  Shared motion primitives and reduced-motion rules.
- `src/test/app-shell.redesign.test.tsx`
  Shell rendering, nav, and command bar behavior tests.
- `src/test/dashboard-redesign.test.tsx`
  Dashboard structure and action-first rendering tests.

### Existing files to modify

- `src/App.tsx`
  Integrate new shell, route page content through it, keep feature logic intact.
- `src/features/app-shell/appShellController.ts`
  Extend nav grouping, page meta, and shell-specific page presentation data.
- `src/pages/WalletAnalyzer.tsx`
  Recompose the page using shell components and redesigned executive layout.
- `src/pages/MyInvestmentsPage.tsx`
  Adopt new page hero/section framing while preserving ledger behavior.
- `src/components/TransactionList.tsx`
  Restyle and reframe dense ledger surfaces for the new design language.
- `src/components/my-investments/MyInvestmentsUtilityStrip.tsx`
  Align utility strip with new shell surface language.
- `src/styles/wallet-analyzer.css`
  Reduce page-local one-off styling after migration to shared surfaces.
- `src/index.css`
  Remove or trim shell/page-level global rules replaced by shared style files.
- `src/test/wallet-analyzer.test.tsx`
  Update layout and shell expectations.
- `src/test/my-investments-page.test.tsx`
  Update framing and utility-strip expectations.
- `src/test/transaction-list.test.tsx`
  Update ledger presentation expectations if needed.

---

### Task 1: Create the shared token and surface foundation

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/layout.css`
- Create: `src/styles/surfaces.css`
- Create: `src/styles/motion.css`
- Modify: `src/index.css`
- Test: `src/test/app-shell.redesign.test.tsx`

- [ ] **Step 1: Write the failing shell token test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../components/dashboard-shell/AppShell';

describe('AppShell redesign tokens', () => {
  it('renders the executive shell root and command bar slots', () => {
    render(
      <AppShell
        activeTab="home"
        navItems={[]}
        pageTitle="Dashboard"
        pageSubtitle="Action-first executive briefing."
        commandBar={<div>Command bar</div>}
      >
        <div>Body</div>
      </AppShell>,
    );

    expect(screen.getByText('Command bar')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(document.querySelector('.exec-shell')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/app-shell.redesign.test.tsx`
Expected: FAIL with module not found for `AppShell`.

- [ ] **Step 3: Add the shared token and surface CSS files**

```css
/* src/styles/tokens.css */
:root {
  --exec-space-2: 8px;
  --exec-space-3: 12px;
  --exec-space-4: 16px;
  --exec-space-6: 24px;
  --exec-space-8: 32px;
  --exec-radius-card: 22px;
  --exec-radius-pill: 999px;
  --exec-font-display: var(--font-shell-display, 'Inter', sans-serif);
  --exec-font-ui: var(--font-shell-body, 'Inter', sans-serif);

  --exec-bg-canvas: #f4f2ed;
  --exec-bg-panel: rgba(255,255,255,0.78);
  --exec-bg-panel-strong: #ffffff;
  --exec-border-soft: rgba(23, 27, 36, 0.08);
  --exec-text-strong: #151922;
  --exec-text-muted: #5f6777;
  --exec-accent: #2f6fed;
  --exec-positive: #12835e;
  --exec-negative: #b54747;
  --exec-warning: #b7791f;
  --exec-shadow-card: 0 18px 40px rgba(20, 24, 32, 0.07);
}

[data-theme='dark'] {
  --exec-bg-canvas: #0f131a;
  --exec-bg-panel: rgba(20,24,32,0.86);
  --exec-bg-panel-strong: #141923;
  --exec-border-soft: rgba(255,255,255,0.08);
  --exec-text-strong: #f5f7fb;
  --exec-text-muted: #98a3b8;
  --exec-shadow-card: 0 20px 46px rgba(0,0,0,0.28);
}
```

```css
/* src/styles/layout.css */
.exec-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background: var(--exec-bg-canvas);
  color: var(--exec-text-strong);
}

.exec-shell__main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
}

.exec-page {
  width: min(1480px, calc(100vw - 80px));
  margin: 0 auto;
  padding: 28px 0 48px;
  display: grid;
  gap: var(--exec-space-6);
}

@media (max-width: 1100px) {
  .exec-shell {
    grid-template-columns: 1fr;
  }

  .exec-page {
    width: min(100%, calc(100vw - 32px));
    padding: 20px 0 36px;
  }
}
```

```css
/* src/styles/surfaces.css */
.exec-panel {
  border: 1px solid var(--exec-border-soft);
  border-radius: var(--exec-radius-card);
  background: var(--exec-bg-panel);
  box-shadow: var(--exec-shadow-card);
  backdrop-filter: blur(18px);
}

.exec-panel--strong {
  background: var(--exec-bg-panel-strong);
}

.exec-kicker {
  color: var(--exec-text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.exec-title {
  font-family: var(--exec-font-display);
  letter-spacing: -0.04em;
}
```

```css
/* src/styles/motion.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Wire the new shared styles into the global app entry**

```tsx
// add near the top of src/index.css imports or equivalent entry point usage
@import './styles/tokens.css';
@import './styles/layout.css';
@import './styles/surfaces.css';
@import './styles/motion.css';
```

- [ ] **Step 5: Run the shell token test**

Run: `npm run test -- src/test/app-shell.redesign.test.tsx`
Expected: still FAIL because `AppShell` is not implemented yet, but style files compile.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/layout.css src/styles/surfaces.css src/styles/motion.css src/index.css src/test/app-shell.redesign.test.tsx
git commit -m "feat: add executive redesign token foundation"
```

### Task 2: Build the reusable shell primitives

**Files:**
- Create: `src/components/dashboard-shell/AppShell.tsx`
- Create: `src/components/dashboard-shell/CommandBar.tsx`
- Create: `src/components/dashboard-shell/PageHero.tsx`
- Create: `src/components/dashboard-shell/SectionFrame.tsx`
- Create: `src/components/dashboard-shell/MetricCard.tsx`
- Create: `src/components/dashboard-shell/InsightRail.tsx`
- Create: `src/components/dashboard-shell/ContextActionStrip.tsx`
- Create: `src/components/dashboard-shell/index.ts`
- Test: `src/test/app-shell.redesign.test.tsx`

- [ ] **Step 1: Write the failing component behavior test**

```tsx
it('renders grouped navigation and page hero content', () => {
  render(
    <AppShell
      activeTab="home"
      navItems={[
        { id: 'home', label: 'Dashboard', icon: () => null },
        { id: 'wallet-analyzer', label: 'Wallet Analyzer', icon: () => null },
      ]}
      pageTitle="Dashboard"
      pageSubtitle="Action-first executive briefing."
      commandBar={<div>Refresh</div>}
    >
      <PageHero
        kicker="Executive"
        title="What needs action now"
        subtitle="Surface risk, movement, and next steps."
      />
    </AppShell>,
  );

  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Wallet Analyzer')).toBeInTheDocument();
  expect(screen.getByText('What needs action now')).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement the shell primitives minimally**

```tsx
// src/components/dashboard-shell/AppShell.tsx
import type { ReactNode } from 'react';
import type { ActiveTab, AppShellNavItem } from '../../features/app-shell/appShellController';

type AppShellProps = {
  activeTab: ActiveTab;
  navItems: readonly AppShellNavItem[];
  pageTitle: string;
  pageSubtitle: string;
  commandBar: ReactNode;
  children: ReactNode;
};

export function AppShell({
  activeTab,
  navItems,
  pageTitle,
  pageSubtitle,
  commandBar,
  children,
}: AppShellProps) {
  return (
    <div className="exec-shell">
      <aside className="exec-shell__rail exec-panel exec-panel--strong">
        <div className="exec-rail__brand">
          <span className="exec-kicker">PulsePort</span>
          <strong className="exec-title">Executive cockpit</strong>
        </div>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeTab ? 'exec-nav-item is-active' : 'exec-nav-item'}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="exec-shell__main">
        {commandBar}
        <div className="exec-page" aria-label={pageTitle}>
          <header className="exec-page-head">
            <h1 className="exec-title">{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
```

```tsx
// src/components/dashboard-shell/PageHero.tsx
import type { ReactNode } from 'react';

export function PageHero({
  kicker,
  title,
  subtitle,
  actions,
  stats,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  stats?: ReactNode;
}) {
  return (
    <section className="exec-panel exec-page-hero">
      <div>
        <p className="exec-kicker">{kicker}</p>
        <h2 className="exec-title">{title}</h2>
        <p>{subtitle}</p>
        {actions}
      </div>
      {stats ? <div>{stats}</div> : null}
    </section>
  );
}
```

- [ ] **Step 3: Export the shell primitives through a barrel**

```ts
export * from './AppShell';
export * from './CommandBar';
export * from './PageHero';
export * from './SectionFrame';
export * from './MetricCard';
export * from './InsightRail';
export * from './ContextActionStrip';
```

- [ ] **Step 4: Run the shell tests**

Run: `npm run test -- src/test/app-shell.redesign.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard-shell src/test/app-shell.redesign.test.tsx
git commit -m "feat: add executive dashboard shell primitives"
```

### Task 3: Extend the app-shell controller and wrap the app in the new shell

**Files:**
- Modify: `src/features/app-shell/appShellController.ts`
- Modify: `src/App.tsx`
- Test: `src/test/app-shell.redesign.test.tsx`

- [ ] **Step 1: Write the failing app-shell integration test**

```tsx
it('provides page meta and nav items needed by the executive shell', () => {
  const controller = buildAppShellController('wallet-analyzer');

  expect(controller.pageMeta['wallet-analyzer'].title).toBe('Wallet Analyzer');
  expect(controller.navItems.some((item) => item.id === 'home')).toBe(true);
  expect(controller.mobilePrimaryNavItems.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Extend the controller with shell-facing presentation groups**

```ts
export function buildAppShellController(activeTab: ActiveTab) {
  const mobilePrimaryNavItems = APP_NAV_ITEMS.filter((item) => MOBILE_PRIMARY_TAB_IDS.includes(item.id));
  const mobileMoreNavItems = APP_NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_TAB_IDS.includes(item.id));

  return {
    navItems: APP_NAV_ITEMS,
    pageMeta: APP_PAGE_META,
    mobilePrimaryNavItems,
    mobileMoreNavItems,
    mobileMoreActive: mobileMoreNavItems.some((item) => item.id === activeTab),
    navGroups: [
      {
        label: 'Portfolio',
        itemIds: ['home', 'overview', 'pulsechain-official', 'wallet-analyzer'] satisfies ActiveTab[],
      },
      {
        label: 'Execution',
        itemIds: ['history', 'stakes', 'defi', 'bridge'] satisfies ActiveTab[],
      },
    ],
  };
}
```

- [ ] **Step 3: Wrap page rendering in `App.tsx` with the new shell**

```tsx
const shell = buildAppShellController(activeTab);
const pageMeta = shell.pageMeta[activeTab];

return (
  <AppShell
    activeTab={activeTab}
    navItems={shell.navItems}
    pageTitle={pageMeta.title}
    pageSubtitle={pageMeta.subtitle}
    commandBar={
      <CommandBar
        walletLabel={selectedWalletAddr === 'all' ? 'All wallets' : selectedWalletAddr}
        onRefresh={fetchPortfolio}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        theme={theme}
        apiStatus={etherscanApiKey ? 'API set' : 'API missing'}
      />
    }
  >
    {pageContent}
  </AppShell>
);
```

- [ ] **Step 4: Run controller and shell tests**

Run: `npm run test -- src/test/app-shell.redesign.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/app-shell/appShellController.ts src/App.tsx src/test/app-shell.redesign.test.tsx
git commit -m "feat: wrap app in executive cockpit shell"
```

### Task 4: Extract and redesign the Dashboard into an action-first executive page

**Files:**
- Create: `src/components/dashboard/CoreActionBoard.tsx`
- Create: `src/components/dashboard/PortfolioHealthBoard.tsx`
- Create: `src/components/dashboard/StrategyBoard.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/dashboard-redesign.test.tsx`

- [ ] **Step 1: Write the failing dashboard structure test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoreActionBoard } from '../components/dashboard/CoreActionBoard';

describe('Dashboard redesign', () => {
  it('renders action-first and portfolio-health sections', () => {
    render(
      <div>
        <CoreActionBoard
          alerts={[{ id: '1', title: 'High concentration', detail: 'HEX is 55% of the bag.' }]}
          actions={[{ id: 'planner', label: 'Open Profit Planner' }]}
        />
      </div>,
    );

    expect(screen.getByText(/high concentration/i)).toBeInTheDocument();
    expect(screen.getByText(/open profit planner/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Build the dashboard modules minimally**

```tsx
// src/components/dashboard/CoreActionBoard.tsx
type AlertItem = { id: string; title: string; detail: string };
type ActionItem = { id: string; label: string; onClick?: () => void };

export function CoreActionBoard({
  alerts,
  actions,
}: {
  alerts: AlertItem[];
  actions: ActionItem[];
}) {
  return (
    <section className="exec-panel exec-panel--strong">
      <div className="exec-section-head">
        <p className="exec-kicker">Action</p>
        <h2 className="exec-title">What needs action now</h2>
      </div>
      <div>
        {alerts.map((alert) => (
          <article key={alert.id}>
            <strong>{alert.title}</strong>
            <p>{alert.detail}</p>
          </article>
        ))}
      </div>
      <div>
        {actions.map((action) => (
          <button key={action.id} type="button" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Replace the current home tab inline stack with the new dashboard composition**

```tsx
{activeTab === 'home' && (
  <div className="exec-dashboard-grid">
    <PageHero
      kicker="Executive"
      title="What needs action now"
      subtitle="Surface risk, movement, and next steps before the deeper ledgers."
      actions={<ContextActionStrip actions={dashboardActions} />}
      stats={<DashboardHeroStats stats={dashboardHeroStats} />}
    />
    <CoreActionBoard alerts={dashboardAlerts} actions={dashboardActions} />
    <PortfolioHealthBoard summary={summary} allocationRows={investmentRows.slice(0, 5)} />
    <StrategyBoard
      rotationPnlPls={walletAnalyzerModel.rotation.totalPnlPls}
      analyzerAction={() => setActiveTab('wallet-analyzer')}
    />
  </div>
)}
```

- [ ] **Step 4: Run the dashboard tests**

Run: `npm run test -- src/test/dashboard-redesign.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard src/App.tsx src/test/dashboard-redesign.test.tsx
git commit -m "feat: redesign dashboard as executive action cockpit"
```

### Task 5: Redesign Wallet Analyzer as the strategy benchmark page

**Files:**
- Modify: `src/pages/WalletAnalyzer.tsx`
- Modify: `src/components/wallet-analyzer/CoreRotationCard.tsx`
- Modify: `src/components/wallet-analyzer/PortfolioPerformanceChart.tsx`
- Modify: `src/components/wallet-analyzer/RiskMetricsPanel.tsx`
- Modify: `src/components/wallet-analyzer/TradeBehaviorCard.tsx`
- Modify: `src/styles/wallet-analyzer.css`
- Test: `src/test/wallet-analyzer.test.tsx`

- [ ] **Step 1: Write the failing Wallet Analyzer layout test**

```tsx
it('renders planner, performance, chain mix, rotation, and holdings in the new executive structure', () => {
  renderWalletAnalyzerPage(model, rows);

  expect(screen.getByText(/portfolio performance/i)).toBeInTheDocument();
  expect(screen.getByText(/chain mix/i)).toBeInTheDocument();
  expect(screen.getByText(/core rotation vs pls/i)).toBeInTheDocument();
  expect(screen.getByText(/holdings attribution/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open profit planner/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Recompose the Wallet Analyzer page with shell primitives**

```tsx
return (
  <div className="exec-analyzer-page">
    <PageHero
      kicker="Analyzer"
      title="Wallet Analyzer"
      subtitle="Performance, risk, and behavior analytics across the tracked portfolio."
      actions={
        <ContextActionStrip
          actions={[
            { id: 'planner', label: 'Open Profit Planner', onClick: onOpenPlanner },
            { id: 'ledger', label: 'Open Transactions', onClick: () => onOpenTransactions({ kind: 'chain', chain: 'pulsechain', txType: 'all' }) },
          ]}
        />
      }
      stats={<AnalyzerHeroStats model={model} />}
    />

    <div className="exec-analyzer-grid">
      <div className="exec-analyzer-grid__primary">
        <PortfolioPerformanceChart ... />
        <ChainMixCard ... />
        <section className="exec-panel exec-panel--strong">{holdingsBlock}</section>
      </div>
      <div className="exec-analyzer-grid__secondary">
        <RiskMetricsPanel ... />
        <TradeBehaviorCard ... />
        <CoreRotationCard ... />
        <TopContributorsCard ... />
      </div>
    </div>
  </div>
);
```

- [ ] **Step 3: Update local analyzer CSS to consume the shared design language instead of competing with it**

```css
.exec-analyzer-page {
  display: grid;
  gap: var(--exec-space-6);
}

.exec-analyzer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.95fr);
  gap: var(--exec-space-6);
  align-items: start;
}
```

- [ ] **Step 4: Run Wallet Analyzer tests**

Run: `npm run test -- src/test/wallet-analyzer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/WalletAnalyzer.tsx src/components/wallet-analyzer/CoreRotationCard.tsx src/components/wallet-analyzer/PortfolioPerformanceChart.tsx src/components/wallet-analyzer/RiskMetricsPanel.tsx src/components/wallet-analyzer/TradeBehaviorCard.tsx src/styles/wallet-analyzer.css src/test/wallet-analyzer.test.tsx
git commit -m "feat: redesign wallet analyzer as strategy cockpit"
```

### Task 6: Upgrade My Investments into the new shell language without changing ledger logic

**Files:**
- Modify: `src/pages/MyInvestmentsPage.tsx`
- Modify: `src/components/my-investments/MyInvestmentsUtilityStrip.tsx`
- Modify: `src/components/my-investments/MyInvestmentsFilters.tsx`
- Modify: `src/components/my-investments/MyInvestmentsTable.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing My Investments framing test**

```tsx
it('renders the canonical ledger inside the executive page framing', () => {
  render(
    <MyInvestmentsPage
      rows={rows}
      plsUsdPrice={0.00008}
      onOpenPlanner={vi.fn()}
      onOpenMarketWatch={vi.fn()}
      onOpenTransactions={vi.fn()}
    />,
  );

  expect(screen.getByText(/holdings attribution/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profit planner/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Wrap the page in shared `PageHero` and `SectionFrame` surfaces**

```tsx
return (
  <div className="exec-investments-page">
    <PageHero
      kicker="Ledger"
      title="My Investments"
      subtitle="Canonical ownership, cost basis, and source attribution."
      actions={
        <ContextActionStrip
          actions={[
            { id: 'planner', label: 'Profit Planner', onClick: onOpenPlanner },
            { id: 'watch', label: 'Market Watch', onClick: onOpenMarketWatch },
          ]}
        />
      }
    />
    <SectionFrame
      kicker="Holdings"
      title="Holdings Attribution"
      description="The source-of-truth ownership ledger."
    >
      <MyInvestmentsFilters ... />
      <MyInvestmentsTable ... />
    </SectionFrame>
  </div>
);
```

- [ ] **Step 3: Keep utility logic intact but align the strip visually with the shell surfaces**

```tsx
<section className="exec-panel exec-panel--strong mi-utility-strip" aria-label="My Investments tools">
  ...
</section>
```

- [ ] **Step 4: Run My Investments tests**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyInvestmentsPage.tsx src/components/my-investments/MyInvestmentsUtilityStrip.tsx src/components/my-investments/MyInvestmentsFilters.tsx src/components/my-investments/MyInvestmentsTable.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: restyle my investments for executive shell"
```

### Task 7: Upgrade Transactions into a calmer dense ledger

**Files:**
- Modify: `src/components/TransactionList.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/transaction-list.test.tsx`

- [ ] **Step 1: Write the failing transaction surface test**

```tsx
it('renders the transaction ledger inside the dense executive container', () => {
  render(<TransactionList transactions={transactions} wallets={wallets} />);

  expect(document.querySelector('.tx-ledger-surface')).not.toBeNull();
});
```

- [ ] **Step 2: Add a single new dense ledger wrapper class without changing transaction logic**

```tsx
return (
  <section className="exec-panel exec-panel--strong tx-ledger-surface">
    <div className="tx-ledger-surface__head">...</div>
    <div className="tx-ledger-surface__body">...</div>
  </section>
);
```

- [ ] **Step 3: Update the Transactions page mount in `App.tsx` to use `PageHero` + dense surface framing**

```tsx
{activeTab === 'history' && (
  <div className="exec-transactions-page">
    <PageHero
      kicker="Ledger"
      title="Transactions"
      subtitle="Full operational ledger for bridges, swaps, staking, and source-aware drill-down."
      actions={<ContextActionStrip actions={transactionPageActions} />}
    />
    <TransactionList ... />
  </div>
)}
```

- [ ] **Step 4: Run the transaction tests**

Run: `npm run test -- src/test/transaction-list.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionList.tsx src/App.tsx src/test/transaction-list.test.tsx
git commit -m "feat: restyle transactions as calm dense ledger"
```

### Task 8: Apply the shell system to specialist pages and finalize responsive behavior

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/app-shell/appShellController.ts`
- Modify: `src/index.css`
- Test: `src/test/app-shell.redesign.test.tsx`

- [ ] **Step 1: Add a smoke test for specialist page shell presence**

```tsx
it('keeps specialist tabs inside the same shell framing', () => {
  const controller = buildAppShellController('defi');
  expect(controller.pageMeta.defi.title).toBe('DeFi');
  expect(controller.navItems.some((item) => item.id === 'defi')).toBe(true);
});
```

- [ ] **Step 2: Ensure each remaining page render branch sits inside the `AppShell` content model**

```tsx
// preserve each page component, but remove legacy page-level outer wrappers that fight the shell
{activeTab === 'stakes' && <StakesWorkspace ... />}
{activeTab === 'defi' && <DefiWorkspace ... />}
{activeTab === 'bridge' && <BridgeWorkspace ... />}
```

- [ ] **Step 3: Add responsive polish rules for left rail, command bar, and page width**

```css
@media (max-width: 780px) {
  .exec-page {
    width: min(100%, calc(100vw - 20px));
  }

  .exec-analyzer-grid,
  .exec-dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run shell tests again**

Run: `npm run test -- src/test/app-shell.redesign.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/features/app-shell/appShellController.ts src/index.css src/test/app-shell.redesign.test.tsx
git commit -m "feat: complete executive shell rollout"
```

### Task 9: Browser verification, visual gap pass, and deployment readiness

**Files:**
- Modify: `src/styles/wallet-analyzer.css`
- Modify: `src/index.css`
- Modify: `src/components/dashboard-shell/*` as needed
- Test: no new unit test file; use browser verification and regression suite

- [ ] **Step 1: Start the dev server**

Run: `npm run dev -- --host 127.0.0.1 --port 4174`
Expected: Vite dev server ready on `http://127.0.0.1:4174`

- [ ] **Step 2: Verify in a browser using the in-app browser first**

Check:
- Dashboard first viewport shows action-first layout
- Wallet Analyzer looks like a strategy cockpit
- My Investments feels consistent with the new shell
- Transactions remains dense but calmer
- both light and dark themes work

Expected:
- no blank page
- no error overlay
- visible shell/nav/command bar

- [ ] **Step 3: Name at least five visual mismatches and fix them**

Example mismatch list to look for:

```text
1. Hero spacing too tight compared with shell rhythm.
2. Transaction surface borders stronger than adjacent executive panels.
3. Wallet Analyzer side column visually heavier than the primary column.
4. My Investments utility strip still reads like a legacy module.
5. Mobile command bar wraps awkwardly under 780px.
```

- [ ] **Step 4: Re-run browser verification after fixes**

Run:
- `npm run lint`
- `npm run test`

Expected:
- lint PASS
- full test suite PASS
- browser visual pass with no material mismatches remaining

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: finalize executive cockpit redesign polish"
```

## Self-Review

### Spec coverage

- Shared shell and design system: covered by Tasks 1-3
- Dashboard redesign: covered by Task 4
- Wallet Analyzer redesign: covered by Task 5
- My Investments integration: covered by Task 6
- Transactions redesign: covered by Task 7
- Specialist page consistency: covered by Task 8
- Visual polish and verification: covered by Task 9

No major spec sections are uncovered.

### Placeholder scan

Checked for:
- TBD
- TODO
- vague “implement later”
- “write tests for above”

Removed placeholders and replaced them with explicit file paths, code, commands, and expected outcomes.

### Type consistency

- `AppShell`, `CommandBar`, `PageHero`, `SectionFrame`, `MetricCard`, `InsightRail`, `ContextActionStrip` are used consistently across later tasks.
- `buildAppShellController` remains the source for nav items and page meta.
- `WalletAnalyzerPage` stays fed by `buildWalletAnalyzerPageProps`.

No obvious naming contradictions remain.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-30-executive-cockpit-dashboard-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
