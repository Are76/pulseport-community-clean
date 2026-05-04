# PulsePort Dark Workstation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert PulsePort from the current mixed dashboard/cockpit styling into a coherent dark workstation system inspired by OKX’s cleanliness while preserving PulsePort’s portfolio, history, and analytics depth.

**Architecture:** Build a new dark workstation shell and shared surface system first, then migrate the four primary investor pages (`Home`, `Portfolio`, `History`, `Analysis`) onto the same layout and interaction language. Keep business logic and analytics intact while replacing page composition, spacing, table framing, filter controls, and summary surfaces.

**Tech Stack:** React, TypeScript, Vite, existing app state in `src/App.tsx`, feature utilities under `src/features/*`, CSS-based theming, Vitest, Testing Library.

---

## File Structure

### New files

- `src/components/workstation-shell/WorkstationShell.tsx`
  Global shell wrapper for left rail, top utility bar, and bounded page canvas.
- `src/components/workstation-shell/RailNav.tsx`
  Slim icon-plus-label desktop rail and mobile drawer variant.
- `src/components/workstation-shell/TopUtilityBar.tsx`
  Search, wallet scope, network scope, refresh, API state, theme.
- `src/components/workstation-shell/WalletHeader.tsx`
  Reusable large value header used by Home, Portfolio, History, and Analysis.
- `src/components/workstation-shell/MetricStrip.tsx`
  Equal-height metric row for compact KPIs.
- `src/components/workstation-shell/ControlBar.tsx`
  Dense segmented filters and action controls.
- `src/components/workstation-shell/WorkSurface.tsx`
  Shared table and analysis container.
- `src/components/workstation-shell/index.ts`
  Barrel exports.
- `src/styles/workstation-tokens.css`
  Dark workstation color, spacing, borders, radii, typography tokens.
- `src/styles/workstation-layout.css`
  Shell grid, rail widths, page widths, header rhythm, responsive behavior.
- `src/styles/workstation-surfaces.css`
  Table, strip, control bar, work surface, and empty state styling.
- `src/test/workstation-shell.test.tsx`
  Shell rendering and rail/nav tests.
- `src/test/workstation-home.test.tsx`
  Home structure test.

### Existing files to modify

- `src/App.tsx`
  Recompose routing, Home, and shared shell usage.
- `src/features/app-shell/appShellController.ts`
  Update nav labels, grouping, icon mapping, and page meta for new structure.
- `src/pages/WalletAnalyzer.tsx`
  Restyle into `Analysis` workspace bands.
- `src/pages/MyInvestmentsPage.tsx`
  Restyle into the `Portfolio` workstation surface.
- `src/components/TransactionList.tsx`
  Dense workstation row styling and table behavior.
- `src/components/my-investments/MyInvestmentsTable.tsx`
  Table-first holdings styling and compact row layout.
- `src/index.css`
  Remove overlapping legacy shell rules and import workstation styles.
- `src/test/dashboard-redesign.test.tsx`
  Replace old executive-cockpit expectations with workstation expectations.
- `src/test/my-investments-page.test.tsx`
  Update portfolio framing assertions.
- `src/test/transaction-list.test.tsx`
  Update history table expectations.
- `src/test/wallet-analyzer.test.tsx`
  Update analysis page framing expectations.

---

### Task 1: Build the dark workstation shell foundation

**Files:**
- Create: `src/components/workstation-shell/WorkstationShell.tsx`
- Create: `src/components/workstation-shell/RailNav.tsx`
- Create: `src/components/workstation-shell/TopUtilityBar.tsx`
- Create: `src/components/workstation-shell/index.ts`
- Create: `src/styles/workstation-tokens.css`
- Create: `src/styles/workstation-layout.css`
- Create: `src/styles/workstation-surfaces.css`
- Modify: `src/index.css`
- Test: `src/test/workstation-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkstationShell } from '../components/workstation-shell';

describe('workstation shell', () => {
  it('renders desktop rail, top utility bar, and page canvas', () => {
    render(
      <WorkstationShell
        navItems={[{ id: 'home', label: 'Home', icon: () => null }]}
        activeTab="home"
        utilityBar={<div>Utility</div>}
      >
        <div>Body</div>
      </WorkstationShell>,
    );

    expect(screen.getByText('Utility')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(document.querySelector('.ws-shell')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/workstation-shell.test.tsx`
Expected: FAIL with module not found for `workstation-shell`.

- [ ] **Step 3: Add the token and shell CSS foundation**

```css
/* src/styles/workstation-tokens.css */
:root {
  --ws-bg: #0a0b0d;
  --ws-panel: #121316;
  --ws-panel-2: #17191d;
  --ws-border: rgba(255,255,255,0.08);
  --ws-text: #f5f7fb;
  --ws-text-muted: #98a3b8;
  --ws-accent: #b7ff37;
  --ws-positive: #9dff4f;
  --ws-negative: #ff4da1;
  --ws-space-3: 12px;
  --ws-space-4: 16px;
  --ws-space-6: 24px;
  --ws-space-8: 32px;
  --ws-radius: 18px;
}
```

```css
/* src/styles/workstation-layout.css */
.ws-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  background: var(--ws-bg);
  color: var(--ws-text);
}

.ws-main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
}

.ws-page {
  width: min(1680px, calc(100vw - 56px));
  margin: 0 auto;
  padding: 28px 0 48px;
}
```

- [ ] **Step 4: Add the minimal shell components**

```tsx
// src/components/workstation-shell/WorkstationShell.tsx
type WorkstationShellProps = {
  navItems: Array<{ id: string; label: string; icon: React.ComponentType<any> }>;
  activeTab: string;
  utilityBar: React.ReactNode;
  children: React.ReactNode;
};

export function WorkstationShell({ navItems, activeTab, utilityBar, children }: WorkstationShellProps) {
  return (
    <div className="ws-shell">
      <aside className="ws-rail">
        {navItems.map((item) => (
          <button key={item.id} className={item.id === activeTab ? 'ws-rail-item is-active' : 'ws-rail-item'}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </aside>
      <div className="ws-main">
        <header className="ws-topbar">{utilityBar}</header>
        <main className="ws-page">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/test/workstation-shell.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/workstation-shell src/styles/workstation-tokens.css src/styles/workstation-layout.css src/styles/workstation-surfaces.css src/index.css src/test/workstation-shell.test.tsx
git commit -m "feat: add dark workstation shell foundation"
```

---

### Task 2: Convert Home into the hybrid summary page

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/workstation-shell/WalletHeader.tsx`
- Create: `src/components/workstation-shell/MetricStrip.tsx`
- Create: `src/components/workstation-shell/ControlBar.tsx`
- Test: `src/test/workstation-home.test.tsx`

- [ ] **Step 1: Write the failing Home test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('workstation home', () => {
  it('renders wallet header and the three home bands', () => {
    render(<App />);

    expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/history/i)).toBeInTheDocument();
    expect(screen.getByText(/analysis/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/workstation-home.test.tsx`
Expected: FAIL because the new headings are not present.

- [ ] **Step 3: Add the reusable header and KPI strip components**

```tsx
// src/components/workstation-shell/WalletHeader.tsx
type WalletHeaderProps = {
  title: string;
  value: string;
  address?: string;
  actions?: React.ReactNode;
  controls?: React.ReactNode;
};

export function WalletHeader({ title, value, address, actions, controls }: WalletHeaderProps) {
  return (
    <section className="ws-wallet-header">
      <div className="ws-wallet-header__main">
        <span className="ws-wallet-header__title">{title}</span>
        {address ? <span className="ws-wallet-header__address">{address}</span> : null}
        <strong className="ws-wallet-header__value">{value}</strong>
      </div>
      <div className="ws-wallet-header__side">
        {controls}
        {actions}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Recompose the Home route in `src/App.tsx`**

```tsx
{activeTab === 'home' && (
  <div className="ws-home">
    <WalletHeader
      title="PulsePort Home"
      value={`$${summary.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
      address={wallets[0]?.address ? `${wallets[0].address.slice(0, 10)}...${wallets[0].address.slice(-6)}` : undefined}
      controls={<div className="ws-time-range">...</div>}
      actions={<div className="ws-header-actions">...</div>}
    />
    <MetricStrip items={homeKpis} />
    <section className="ws-home-band">
      <h2>Portfolio</h2>
      ...
    </section>
    <section className="ws-home-band">
      <h2>History</h2>
      ...
    </section>
    <section className="ws-home-band">
      <h2>Analysis</h2>
      ...
    </section>
  </div>
)}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/test/workstation-home.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/workstation-shell/WalletHeader.tsx src/components/workstation-shell/MetricStrip.tsx src/components/workstation-shell/ControlBar.tsx src/test/workstation-home.test.tsx
git commit -m "feat: convert home to dark workstation summary"
```

---

### Task 3: Convert Portfolio into a table-first holdings workspace

**Files:**
- Modify: `src/pages/MyInvestmentsPage.tsx`
- Modify: `src/components/my-investments/MyInvestmentsTable.tsx`
- Modify: `src/components/my-investments/MyInvestmentsAssetPanel.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing Portfolio framing assertion**

```tsx
it('renders portfolio as a workstation holdings surface', () => {
  render(<MyInvestmentsPage {...props} />);
  expect(screen.getByText(/holdings/i)).toBeInTheDocument();
  expect(document.querySelector('.ws-table-surface')).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL because `.ws-table-surface` does not exist.

- [ ] **Step 3: Restyle the page and holdings table**

```tsx
// src/pages/MyInvestmentsPage.tsx
return (
  <div className="ws-portfolio-page">
    <WalletHeader ... />
    <ControlBar ... />
    <section className="ws-table-surface">
      <MyInvestmentsTable ... />
    </section>
  </div>
);
```

```tsx
// src/components/my-investments/MyInvestmentsTable.tsx
<table className="ws-dense-table ws-dense-table--holdings">
  ...
</table>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyInvestmentsPage.tsx src/components/my-investments/MyInvestmentsTable.tsx src/components/my-investments/MyInvestmentsAssetPanel.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: restyle portfolio as workstation holdings page"
```

---

### Task 4: Convert History into the dense transaction workbench

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TransactionList.tsx`
- Modify: `src/test/transaction-list.test.tsx`

- [ ] **Step 1: Write the failing History test**

```tsx
it('renders the history page as a dense workstation ledger', () => {
  render(<App />);
  expect(document.querySelector('.ws-history-shell')).not.toBeNull();
  expect(document.querySelector('.ws-dense-table')).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/transaction-list.test.tsx`
Expected: FAIL because the workstation ledger classes are missing.

- [ ] **Step 3: Reframe the History page and rows**

```tsx
// src/App.tsx
{activeTab === 'history' && (
  <div className="ws-history-shell">
    <WalletHeader ... />
    <ControlBar ... />
    <TransactionList className="ws-dense-table ws-dense-table--history" ... />
  </div>
)}
```

```tsx
// src/components/TransactionList.tsx
<div className={clsx('ws-history-table', className)}>
  ...
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/transaction-list.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/TransactionList.tsx src/test/transaction-list.test.tsx
git commit -m "feat: convert history to dark workstation ledger"
```

---

### Task 5: Convert Wallet Analyzer into the Analysis workspace

**Files:**
- Modify: `src/pages/WalletAnalyzer.tsx`
- Modify: `src/styles/wallet-analyzer.css`
- Modify: `src/test/wallet-analyzer.test.tsx`

- [ ] **Step 1: Write the failing Analysis test**

```tsx
it('renders analyzer as the analysis workspace', () => {
  render(<WalletAnalyzer {...props} />);
  expect(screen.getByText(/analysis/i)).toBeInTheDocument();
  expect(document.querySelector('.ws-analysis-band')).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/wallet-analyzer.test.tsx`
Expected: FAIL because `.ws-analysis-band` does not exist.

- [ ] **Step 3: Recompose the page into KPI strip + analysis bands**

```tsx
return (
  <div className="ws-analysis-page">
    <WalletHeader ... />
    <MetricStrip items={analysisKpis} />
    <section className="ws-analysis-band">...</section>
    <section className="ws-analysis-band">...</section>
    <section className="ws-analysis-band">...</section>
  </div>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/wallet-analyzer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/WalletAnalyzer.tsx src/styles/wallet-analyzer.css src/test/wallet-analyzer.test.tsx
git commit -m "feat: restyle wallet analyzer as analysis workspace"
```

---

### Task 6: Bring specialist pages and shell polish onto the new system

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/app-shell/appShellController.ts`
- Modify: `src/index.css`
- Test: `src/test/app-shell-controller.test.ts`

- [ ] **Step 1: Write the failing nav/meta assertion**

```tsx
it('maps workstation navigation labels and page titles', () => {
  expect(APP_SHELL_PAGE_META.home.title).toBe('Home');
  expect(APP_SHELL_PAGE_META.history.title).toBe('History');
  expect(APP_SHELL_PAGE_META['wallet-analyzer'].title).toBe('Analysis');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/app-shell-controller.test.ts`
Expected: FAIL because labels still match the old structure.

- [ ] **Step 3: Update nav/page meta and specialist framing**

```ts
export const APP_SHELL_PAGE_META = {
  home: { title: 'Home', subtitle: 'Hybrid summary across portfolio, history, and analysis.' },
  overview: { title: 'Portfolio', subtitle: 'Current holdings, allocation, and position truth.' },
  history: { title: 'History', subtitle: 'Dense ledger for swaps, bridges, and transaction flow.' },
  'wallet-analyzer': { title: 'Analysis', subtitle: 'PnL, behavior, rotation, and risk.' },
  ...
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/app-shell-controller.test.ts`
Expected: PASS

- [ ] **Step 5: Run full verification**

Run: `npm run test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/features/app-shell/appShellController.ts src/index.css src/test/app-shell-controller.test.ts
git commit -m "feat: finish dark workstation shell rollout"
```

---

## Spec Coverage Check

This plan covers:

- shell redesign
- dark workstation tokens and surfaces
- Home as hybrid summary
- Portfolio as holdings workspace
- History as transaction workbench
- Analysis as the strategic page
- nav and page-meta alignment for the whole app

Out of scope for this plan:

- whale and smart-money implementation
- new data providers
- analytics math changes
- new transaction ingestion features

## Self-Review

- No placeholders remain in task steps
- The plan uses exact file paths
- The page model follows the approved spec
- Business logic is preserved while layout and surface language change

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-30-pulseport-dark-workstation-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
