# My Investments Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `My Investments` as a lighter, summary-first capital attribution page anchored on `Invested Fiat`, with inline asset expansion and a clean handoff to transaction-level P&L.

**Architecture:** Extract `My Investments` out of the current `src/App.tsx` monolith into a small page module plus focused supporting components. Reuse existing token and holdings patterns where they are good enough, but stop using the generic holdings table as the page's visual language. Keep transaction-level detail out of the page body and expose it through a compact asset detail surface plus a link to the transaction view.

**Tech Stack:** React 19, TypeScript, Vite, existing app CSS variables and utility styles, Vitest + Testing Library.

---

## File Structure

### New files

- `src/pages/MyInvestmentsPage.tsx`
  - Owns the page composition and top-level props for the new page.
- `src/components/my-investments/MyInvestmentsHero.tsx`
  - Renders the `Invested Fiat` hero strip with supporting metrics.
- `src/components/my-investments/MyInvestmentsFilters.tsx`
  - Renders compact chain pills and any first-pass page filters.
- `src/components/my-investments/MyInvestmentsTable.tsx`
  - Renders current holdings rows using exact-token identity and current-value sorting.
- `src/components/my-investments/MyInvestmentsRowDetails.tsx`
  - Renders inline expanded details: source capital, chain, route, then/now.
- `src/components/my-investments/MyInvestmentsAssetPanel.tsx`
  - Compact asset detail surface for the click-through from `My Investments`.
- `src/test/my-investments-page.test.tsx`
  - Page-level tests for hierarchy, sort, and row expansion.

### Modified files

- `src/App.tsx`
  - Replace the current `My Investments` area wiring with the new page component.
- `src/types.ts`
  - Add any lightweight types needed for investment attribution display.
- `src/index.css`
  - Add only the page-specific layout styles needed for the new visual hierarchy.

### Reused files

- `src/components/TokenCardModal.tsx`
  - Reference only; do not make it the primary `My Investments` UI.
- `src/components/TransactionList.tsx`
  - Remains the transaction-focused surface for later linking.
- `src/utils/normalizeTransactions.ts`
  - Reuse if it already provides enough normalized transaction inputs.

---

### Task 1: Define Display Types For Investment Attribution

**Files:**
- Modify: `src/types.ts`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing type-usage test scaffold**

```tsx
import { describe, expect, it } from 'vitest';
import type { InvestmentHoldingRow } from '../types';

describe('investment holding row shape', () => {
  it('supports invested fiat and current asset attribution fields', () => {
    const row: InvestmentHoldingRow = {
      id: 'hex',
      symbol: 'HEX',
      name: 'HEX',
      chain: 'pulsechain',
      amount: 425000,
      currentPrice: 0.0014,
      currentValue: 596.28,
      costBasis: 721.82,
      pnlUsd: -125.54,
      pnlPercent: -17.39,
      sourceMix: [
        { asset: 'ETH', chain: 'ethereum', amountUsd: 500 },
        { asset: 'USDC', chain: 'base', amountUsd: 221.82 },
      ],
      routeSummary: 'Ethereum -> Bridge -> PulseX -> HEX',
      thenValue: 721.82,
      nowValue: 596.28,
    };

    expect(row.sourceMix).toHaveLength(2);
    expect(row.routeSummary).toContain('Bridge');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL with missing `InvestmentHoldingRow` type.

- [ ] **Step 3: Add the minimal types**

```ts
export interface InvestmentSourceAttribution {
  asset: 'ETH' | 'USDC' | 'DAI' | 'USDT' | string;
  chain: Chain;
  amountUsd: number;
}

export interface InvestmentHoldingRow {
  id: string;
  symbol: string;
  name: string;
  chain: Chain;
  amount: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pnlUsd: number;
  pnlPercent: number;
  sourceMix: InvestmentSourceAttribution[];
  routeSummary: string;
  thenValue: number;
  nowValue: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/test/my-investments-page.test.tsx
git commit -m "feat: add my investments display types"
```

### Task 2: Build The Hero Strip Around Invested Fiat

**Files:**
- Create: `src/components/my-investments/MyInvestmentsHero.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from '@testing-library/react';
import { MyInvestmentsHero } from '../components/my-investments/MyInvestmentsHero';

it('renders invested fiat as the dominant headline label', () => {
  render(
    <MyInvestmentsHero
      investedFiat={27465}
      currentValue={7201}
      pnlUsd={-20264}
      pnlPercent={-73.8}
      liquidValue={5723}
      stakedValue={1478}
      onOpenPlanner={() => {}}
    />
  );

  expect(screen.getByText('Invested Fiat')).toBeInTheDocument();
  expect(screen.getByText('$27,465')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profit planner/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL with missing component.

- [ ] **Step 3: Write the minimal component**

```tsx
interface MyInvestmentsHeroProps {
  investedFiat: number;
  currentValue: number;
  pnlUsd: number;
  pnlPercent: number;
  liquidValue: number;
  stakedValue: number;
  onOpenPlanner: () => void;
}

export function MyInvestmentsHero(props: MyInvestmentsHeroProps) {
  return (
    <section className="mi-hero">
      <div>
        <p className="mi-label">Invested Fiat</p>
        <h1 className="mi-hero-value">${props.investedFiat.toLocaleString('en-US')}</h1>
        <div className="mi-hero-metrics">
          <span>Current Value ${props.currentValue.toLocaleString('en-US')}</span>
          <span>Net P&L {props.pnlUsd >= 0 ? '+' : '-'}${Math.abs(props.pnlUsd).toLocaleString('en-US')}</span>
          <span>Liquid ${props.liquidValue.toLocaleString('en-US')}</span>
          <span>Staked ${props.stakedValue.toLocaleString('en-US')}</span>
        </div>
      </div>
      <button type="button" className="mi-planner-button" onClick={props.onOpenPlanner}>
        Profit Planner
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/my-investments/MyInvestmentsHero.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: add my investments hero"
```

### Task 3: Build Compact Filters And Holdings Table Shell

**Files:**
- Create: `src/components/my-investments/MyInvestmentsFilters.tsx`
- Create: `src/components/my-investments/MyInvestmentsTable.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing filter and default-sort test**

```tsx
import { render, screen, within } from '@testing-library/react';
import { MyInvestmentsTable } from '../components/my-investments/MyInvestmentsTable';
import type { InvestmentHoldingRow } from '../types';

it('sorts holdings by current value descending by default', () => {
  const rows: InvestmentHoldingRow[] = [
    { id: 'prvx', symbol: 'PRVX', name: 'PRVX', chain: 'pulsechain', amount: 1, currentPrice: 1, currentValue: 133.9, costBasis: 120, pnlUsd: 13.9, pnlPercent: 11.5, sourceMix: [], routeSummary: 'Route', thenValue: 120, nowValue: 133.9 },
    { id: 'inc', symbol: 'INC', name: 'INC', chain: 'pulsechain', amount: 1, currentPrice: 1, currentValue: 1082, costBasis: 900, pnlUsd: 182, pnlPercent: 20.2, sourceMix: [], routeSummary: 'Route', thenValue: 900, nowValue: 1082 },
  ];

  render(<MyInvestmentsTable rows={rows} expandedId={null} onToggleRow={() => {}} onOpenAsset={() => {}} />);

  const table = screen.getByRole('table');
  const renderedRows = within(table).getAllByRole('row');
  expect(renderedRows[1]).toHaveTextContent('INC');
  expect(renderedRows[2]).toHaveTextContent('PRVX');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL with missing components.

- [ ] **Step 3: Write the minimal filter and table components**

```tsx
export function MyInvestmentsFilters() {
  return (
    <div className="mi-filters" role="tablist" aria-label="Chain filters">
      <button type="button" className="is-active">All</button>
      <button type="button">PulseChain</button>
      <button type="button">Ethereum</button>
      <button type="button">Base</button>
    </div>
  );
}
```

```tsx
interface MyInvestmentsTableProps {
  rows: InvestmentHoldingRow[];
  expandedId: string | null;
  onToggleRow: (id: string) => void;
  onOpenAsset: (row: InvestmentHoldingRow) => void;
}

export function MyInvestmentsTable({ rows, expandedId, onToggleRow, onOpenAsset }: MyInvestmentsTableProps) {
  const sortedRows = [...rows].sort((a, b) => b.currentValue - a.currentValue);

  return (
    <table className="mi-table">
      <thead>
        <tr>
          <th>Asset</th>
          <th>Current Price</th>
          <th>Amount</th>
          <th>Current Value</th>
          <th>Cost Basis</th>
          <th>P&L</th>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <React.Fragment key={row.id}>
            <tr>
              <td>
                <button type="button" onClick={() => onOpenAsset(row)}>{row.symbol}</button>
              </td>
              <td>${row.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}</td>
              <td>{row.amount.toLocaleString('en-US')}</td>
              <td>${row.currentValue.toLocaleString('en-US')}</td>
              <td>${row.costBasis.toLocaleString('en-US')}</td>
              <td>
                <button type="button" onClick={() => onToggleRow(row.id)}>
                  {row.pnlUsd >= 0 ? '+' : '-'}${Math.abs(row.pnlUsd).toLocaleString('en-US')}
                </button>
              </td>
            </tr>
            {expandedId === row.id ? (
              <tr>
                <td colSpan={6}>expanded</td>
              </tr>
            ) : null}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/my-investments/MyInvestmentsFilters.tsx src/components/my-investments/MyInvestmentsTable.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: add my investments filters and table"
```

### Task 4: Add Inline Row Expansion For Capital Attribution

**Files:**
- Create: `src/components/my-investments/MyInvestmentsRowDetails.tsx`
- Modify: `src/components/my-investments/MyInvestmentsTable.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing row expansion test**

```tsx
import userEvent from '@testing-library/user-event';

it('expands a row to show source capital and route details', async () => {
  const user = userEvent.setup();
  const row = {
    id: 'hex', symbol: 'HEX', name: 'HEX', chain: 'pulsechain', amount: 425000,
    currentPrice: 0.0014, currentValue: 596.28, costBasis: 721.82,
    pnlUsd: -125.54, pnlPercent: -17.39,
    sourceMix: [{ asset: 'ETH', chain: 'ethereum', amountUsd: 721.82 }],
    routeSummary: 'Ethereum -> Bridge -> PulseX -> HEX', thenValue: 721.82, nowValue: 596.28,
  };

  function Harness() {
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    return <MyInvestmentsTable rows={[row]} expandedId={expandedId} onToggleRow={setExpandedId} onOpenAsset={() => {}} />;
  }

  render(<Harness />);
  await user.click(screen.getByRole('button', { name: /125.54/i }));

  expect(screen.getByText(/Ethereum -> Bridge -> PulseX -> HEX/i)).toBeInTheDocument();
  expect(screen.getByText(/ETH/i)).toBeInTheDocument();
  expect(screen.getByText(/721.82/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL because the expansion only renders `expanded`.

- [ ] **Step 3: Implement the detail row component and wire it in**

```tsx
export function MyInvestmentsRowDetails({ row }: { row: InvestmentHoldingRow }) {
  return (
    <div className="mi-row-details">
      <p>{row.routeSummary}</p>
      <ul>
        {row.sourceMix.map((source) => (
          <li key={`${source.asset}-${source.chain}`}>
            {source.asset} · {source.chain} · ${source.amountUsd.toLocaleString('en-US')}
          </li>
        ))}
      </ul>
      <div>
        <span>Then ${row.thenValue.toLocaleString('en-US')}</span>
        <span>Now ${row.nowValue.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
```

```tsx
{expandedId === row.id ? (
  <tr>
    <td colSpan={6}>
      <MyInvestmentsRowDetails row={row} />
    </td>
  </tr>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/my-investments/MyInvestmentsRowDetails.tsx src/components/my-investments/MyInvestmentsTable.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: add my investments row expansion"
```

### Task 5: Add Compact Asset Detail Panel With Transaction Handoff

**Files:**
- Create: `src/components/my-investments/MyInvestmentsAssetPanel.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing panel test**

```tsx
import { render, screen } from '@testing-library/react';
import { MyInvestmentsAssetPanel } from '../components/my-investments/MyInvestmentsAssetPanel';

it('shows compact asset detail and a transaction handoff action', () => {
  render(
    <MyInvestmentsAssetPanel
      row={{
        id: 'hex', symbol: 'HEX', name: 'HEX', chain: 'pulsechain', amount: 425000,
        currentPrice: 0.0014, currentValue: 596.28, costBasis: 721.82,
        pnlUsd: -125.54, pnlPercent: -17.39,
        sourceMix: [], routeSummary: 'Ethereum -> Bridge -> PulseX -> HEX', thenValue: 721.82, nowValue: 596.28,
      }}
      onClose={() => {}}
      onOpenTransactions={() => {}}
    />
  );

  expect(screen.getByText('HEX')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /view full transactions/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL with missing component.

- [ ] **Step 3: Implement the compact panel**

```tsx
interface MyInvestmentsAssetPanelProps {
  row: InvestmentHoldingRow;
  onClose: () => void;
  onOpenTransactions: (row: InvestmentHoldingRow) => void;
}

export function MyInvestmentsAssetPanel({ row, onClose, onOpenTransactions }: MyInvestmentsAssetPanelProps) {
  return (
    <aside className="mi-asset-panel" aria-label={`${row.symbol} details`}>
      <button type="button" onClick={onClose}>Close</button>
      <h2>{row.symbol}</h2>
      <p>{row.name}</p>
      <dl>
        <div><dt>Current Value</dt><dd>${row.currentValue.toLocaleString('en-US')}</dd></div>
        <div><dt>Cost Basis</dt><dd>${row.costBasis.toLocaleString('en-US')}</dd></div>
        <div><dt>Net P&L</dt><dd>{row.pnlUsd >= 0 ? '+' : '-'}${Math.abs(row.pnlUsd).toLocaleString('en-US')}</dd></div>
      </dl>
      <button type="button" onClick={() => onOpenTransactions(row)}>
        View Full Transactions
      </button>
    </aside>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/my-investments/MyInvestmentsAssetPanel.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: add my investments asset panel"
```

### Task 6: Compose The New Page And Wire It Into App State

**Files:**
- Create: `src/pages/MyInvestmentsPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Write the failing composition test**

```tsx
import { render, screen } from '@testing-library/react';
import { MyInvestmentsPage } from '../pages/MyInvestmentsPage';

it('renders the hero, filters, holdings table, and planner action together', () => {
  render(
    <MyInvestmentsPage
      investedFiat={27465}
      currentValue={7201}
      liquidValue={5723}
      stakedValue={1478}
      rows={[]}
      onOpenPlanner={() => {}}
      onOpenTransactions={() => {}}
    />
  );

  expect(screen.getByText('Invested Fiat')).toBeInTheDocument();
  expect(screen.getByRole('tablist', { name: /chain filters/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profit planner/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: FAIL with missing page.

- [ ] **Step 3: Implement the page and replace the old app branch**

```tsx
export function MyInvestmentsPage(props: MyInvestmentsPageProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = React.useState<InvestmentHoldingRow | null>(null);
  const pnlUsd = props.currentValue - props.investedFiat;
  const pnlPercent = props.investedFiat > 0 ? (pnlUsd / props.investedFiat) * 100 : 0;

  return (
    <div className="mi-page">
      <MyInvestmentsHero
        investedFiat={props.investedFiat}
        currentValue={props.currentValue}
        pnlUsd={pnlUsd}
        pnlPercent={pnlPercent}
        liquidValue={props.liquidValue}
        stakedValue={props.stakedValue}
        onOpenPlanner={props.onOpenPlanner}
      />
      <MyInvestmentsFilters />
      <MyInvestmentsTable
        rows={props.rows}
        expandedId={expandedId}
        onToggleRow={(id) => setExpandedId((current) => current === id ? null : id)}
        onOpenAsset={setSelectedAsset}
      />
      {selectedAsset ? (
        <MyInvestmentsAssetPanel
          row={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onOpenTransactions={props.onOpenTransactions}
        />
      ) : null}
    </div>
  );
}
```

```tsx
{activePage === 'my-investments' ? (
  <MyInvestmentsPage
    investedFiat={investedFiat}
    currentValue={portfolioTotalUsd}
    liquidValue={liquidUsd}
    stakedValue={stakedUsd}
    rows={investmentRows}
    onOpenPlanner={() => setProfitPlannerOpen(true)}
    onOpenTransactions={(row) => {
      setTransactionFilter(row.symbol);
      setActivePage('transactions');
    }}
  />
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyInvestmentsPage.tsx src/App.tsx src/test/my-investments-page.test.tsx
git commit -m "feat: rebuild my investments page"
```

### Task 7: Add Page Styling And Full Verification

**Files:**
- Modify: `src/index.css`
- Test: `src/test/my-investments-page.test.tsx`

- [ ] **Step 1: Add minimal page styles for the new hierarchy**

```css
.mi-page {
  display: grid;
  gap: 18px;
}

.mi-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: radial-gradient(circle at top left, rgba(0, 255, 159, 0.14), transparent 38%), var(--bg-surface);
}

.mi-label {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-subtle);
}

.mi-hero-value {
  margin: 0;
  font-size: clamp(3rem, 7vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.mi-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mi-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  background: var(--bg-surface);
}

.mi-row-details,
.mi-asset-panel {
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  border-radius: 16px;
  padding: 18px;
}
```

- [ ] **Step 2: Run focused tests**

Run: `npm run test -- src/test/my-investments-page.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full verification**

Run: `npm run test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS or existing known non-blocking bundle warning only

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/test/my-investments-page.test.tsx
git commit -m "style: add my investments page styling"
```

---

## Self-Review

### Spec coverage

Covered requirements:

- `Invested Fiat` as dominant hero: Tasks 2 and 6
- Current-value-first holdings view: Tasks 3 and 6
- Inline source-capital expansion: Task 4
- Compact asset detail panel with transaction handoff: Task 5
- Lighter visual hierarchy: Task 7
- Keep transaction-level P&L out of the page body: Tasks 5 and 6

No uncovered spec requirements remain for the first implementation pass.

### Placeholder scan

Checked for `TBD`, `TODO`, vague “add error handling”, or missing file paths. None remain.

### Type consistency

Plan uses one display type family:

- `InvestmentSourceAttribution`
- `InvestmentHoldingRow`
- `MyInvestmentsPageProps`

The same names are used consistently across tasks.
