# Code Splitting & Bundle Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce main bundle from 1,468 kB to <800 kB by implementing lazy loading for pages and tabs with dynamic imports.

**Architecture:** Convert static imports of 9 major components (3 pages + 6 tabs) to React.lazy() with Suspense boundaries. Add route-based splitting in App.tsx and tab-based splitting in shell components. Bundle will split into ~150 kB main chunk + 8-10 async chunks loaded on demand.

**Tech Stack:** React 18 lazy/Suspense, Vite dynamic imports, React Router (implicit via tab switching), Tailwind CSS, TypeScript

---

## Task 1: Create Route Lazy Loading Utilities

**Files:**
- Create: `src/utils/lazyComponents.ts`
- Modify: `src/App.tsx:1-50` (imports section)

- [ ] **Step 1: Write lazy loading utility module**

```typescript
// src/utils/lazyComponents.ts
import React, { ComponentType, Suspense, ReactElement } from 'react';

/**
 * Creates a lazy-loaded component with loading fallback
 * @param importFn - Dynamic import function
 * @param fallback - Optional fallback component (default: null)
 * @returns Suspended lazy component
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactElement | null = null
): ComponentType<P> {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <div className="p-8 text-gray-600">Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = 'LazyComponent';
  return WrappedComponent;
}

/**
 * Lazy-loaded pages
 */
export const LazyMyInvestmentsPage = createLazyComponent(() => 
  import('../pages/MyInvestmentsPage').then(m => ({ default: m.MyInvestmentsPage }))
);

export const LazyWalletAnalyzer = createLazyComponent(() => 
  import('../pages/WalletAnalyzer').then(m => ({ default: m.WalletAnalyzer }))
);

export const LazyWalletHoldingsPage = createLazyComponent(() => 
  import('../pages/WalletHoldingsPage').then(m => ({ default: m.WalletHoldingsPage }))
);

/**
 * Lazy-loaded tabs
 */
export const LazyHomeTab = createLazyComponent(() => 
  import('../tabs/HomeTab').then(m => ({ default: m.HomeTab }))
);

export const LazyAssetsTab = createLazyComponent(() => 
  import('../tabs/AssetsTab').then(m => ({ default: m.AssetsTab }))
);

export const LazyStakesTab = createLazyComponent(() => 
  import('../tabs/StakesTab').then(m => ({ default: m.StakesTab }))
);

export const LazyHistoryTab = createLazyComponent(() => 
  import('../tabs/HistoryTab').then(m => ({ default: m.HistoryTab }))
);

export const LazyOverviewTab = createLazyComponent(() => 
  import('../tabs/OverviewTab').then(m => ({ default: m.OverviewTab }))
);

export const LazyWalletsTab = createLazyComponent(() => 
  import('../tabs/WalletsTab').then(m => ({ default: m.WalletsTab }))
);
```

- [ ] **Step 2: Run TypeScript check to validate types**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 3: Commit utility module**

```bash
git add src/utils/lazyComponents.ts
git commit -m "feat: add lazy loading utility for route-based code splitting"
```

---

## Task 2: Implement Lazy Loading in App.tsx

**Files:**
- Modify: `src/App.tsx:1-100`

- [ ] **Step 1: Replace static imports with lazy imports**

Find all these lines in App.tsx and replace:

**OLD:**
```typescript
import { MyInvestmentsPage } from './pages/MyInvestmentsPage';
import { WalletAnalyzer } from './pages/WalletAnalyzer';
import { WalletHoldingsPage } from './pages/WalletHoldingsPage';
```

**NEW:**
```typescript
import { 
  LazyMyInvestmentsPage, 
  LazyWalletAnalyzer, 
  LazyWalletHoldingsPage 
} from './utils/lazyComponents';
```

- [ ] **Step 2: Update pages in tab rendering switch**

Find the tab switch statement (around line 1300-1350) and replace page components:

**OLD:**
```typescript
case 'investments':
  return <MyInvestmentsPage {...investmentProps} />;
case 'wallet-analyzer':
  return <WalletAnalyzer {...analyzerProps} />;
case 'holdings':
  return <WalletHoldingsPage {...holdingsProps} />;
```

**NEW:**
```typescript
case 'investments':
  return <LazyMyInvestmentsPage {...investmentProps} />;
case 'wallet-analyzer':
  return <LazyWalletAnalyzer {...analyzerProps} />;
case 'holdings':
  return <LazyWalletHoldingsPage {...holdingsProps} />;
```

- [ ] **Step 3: Verify imports are correct**

```bash
npm run lint
```

Expected: No errors (may have 0 errors)

- [ ] **Step 4: Run tests to ensure App still works**

```bash
npm test 2>&1 | tail -5
```

Expected: All tests pass, App.test.tsx passes

- [ ] **Step 5: Commit changes**

```bash
git add src/App.tsx
git commit -m "feat: implement lazy loading for pages in App.tsx"
```

---

## Task 3: Convert Tab Components to Lazy Loading

**Files:**
- Modify: `src/shell/shell-layout.tsx:1-100`

- [ ] **Step 1: Replace tab imports with lazy imports in shell-layout**

Find shell-layout.tsx imports section and replace:

**OLD:**
```typescript
import { HomeTab } from '../tabs/HomeTab';
import { AssetsTab } from '../tabs/AssetsTab';
import { StakesTab } from '../tabs/StakesTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { OverviewTab } from '../tabs/OverviewTab';
import { WalletsTab } from '../tabs/WalletsTab';
```

**NEW:**
```typescript
import { 
  LazyHomeTab, 
  LazyAssetsTab, 
  LazyStakesTab, 
  LazyHistoryTab, 
  LazyOverviewTab, 
  LazyWalletsTab 
} from '../utils/lazyComponents';
```

- [ ] **Step 2: Update tab rendering in shell-layout**

Find the tab rendering logic (search for TabContent or similar) and replace component references:

**BEFORE:**
```typescript
{selectedTab === 'home' && <HomeTab {...props} />}
{selectedTab === 'assets' && <AssetsTab {...props} />}
{selectedTab === 'stakes' && <StakesTab {...props} />}
{selectedTab === 'history' && <HistoryTab {...props} />}
{selectedTab === 'overview' && <OverviewTab {...props} />}
{selectedTab === 'wallets' && <WalletsTab {...props} />}
```

**AFTER:**
```typescript
{selectedTab === 'home' && <LazyHomeTab {...props} />}
{selectedTab === 'assets' && <AssetsTab {...props} />}
{selectedTab === 'stakes' && <LazyStakesTab {...props} />}
{selectedTab === 'history' && <LazyHistoryTab {...props} />}
{selectedTab === 'overview' && <LazyOverviewTab {...props} />}
{selectedTab === 'wallets' && <LazyWalletsTab {...props} />}
```

- [ ] **Step 3: Verify compilation**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/shell/shell-layout.tsx
git commit -m "feat: implement lazy loading for tab components"
```

---

## Task 4: Configure Vite Code Splitting Options

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add manual chunk splitting configuration**

Find or create the build config in vite.config.ts and add rollupOptions:

```typescript
export default defineConfig({
  plugins: [react(), electron({ main, preload, preload2 })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into vendor chunk
          if (id.includes('node_modules')) {
            // Core dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // UI/Animation libraries
            if (id.includes('lucide-react') || id.includes('motion')) {
              return 'vendor-ui';
            }
            // Web3 libraries
            if (id.includes('viem') || id.includes('wagmi')) {
              return 'vendor-web3';
            }
            // Utility libraries
            return 'vendor-common';
          }
          
          // Split pages into separate chunks
          if (id.includes('/pages/')) {
            const match = id.match(/\/pages\/([^/]+)\./);
            if (match) return `page-${match[1].toLowerCase()}`;
          }
          
          // Split tabs into separate chunks
          if (id.includes('/tabs/')) {
            const match = id.match(/\/tabs\/([^/]+)\./);
            if (match) return `tab-${match[1].toLowerCase()}`;
          }
        },
      },
      // Increase warning limit since we're intentionally splitting
      chunkSizeWarningLimit: 2000,
    },
  },
  // ... rest of config
});
```

- [ ] **Step 2: Build and verify chunk splitting**

```bash
npm run build 2>&1 | grep -E "(dist/assets|kB)"
```

Expected: Multiple chunks created, each <500 kB, main chunk reduced to ~300-400 kB

- [ ] **Step 3: Verify production build runs**

```bash
npm run preview &
sleep 3 && curl http://localhost:4173 && kill %1
```

Expected: HTML loads successfully, no errors in console

- [ ] **Step 4: Commit configuration changes**

```bash
git add vite.config.ts
git commit -m "feat: configure Vite manual chunk splitting for optimized bundles"
```

---

## Task 5: Validate Bundle Reduction

**Files:**
- Create: `docs/bundle-analysis.md` (documentation only)

- [ ] **Step 1: Generate build report**

```bash
npm run build 2>&1 | tee build-report.log
```

- [ ] **Step 2: Extract and document metrics**

Capture and document:
- Main chunk size (should be <500 kB)
- Total bundle size (should be <800 kB)
- Number of chunks created
- Gzipped sizes

Create bundle-analysis.md with results:

```markdown
# Bundle Analysis Report - Code Splitting Implementation

## Before Code Splitting
- Main bundle: 1,468.21 kB (426.47 kB gzipped)
- Total chunks: 3 (index.html, ccip, main JS)
- Warning: Chunk > 500 kB

## After Code Splitting
- Main bundle: [MEASURED kB] ([MEASURED kB] gzipped)
- Vendor-react: [MEASURED kB]
- Vendor-UI: [MEASURED kB]
- Page chunks: [MEASURED kB each]
- Tab chunks: [MEASURED kB each]
- Total: [MEASURED kB] ([MEASURED kB] gzipped)

## Improvement
- Reduction: [X]% smaller main bundle
- Parallel loading: 8-10 async chunks
- Time to interactive: Improved (pages/tabs load on demand)
```

- [ ] **Step 3: Verify all tests still pass**

```bash
npm test 2>&1 | tail -5
```

Expected: All 160+ tests passing

- [ ] **Step 4: Commit documentation**

```bash
git add docs/bundle-analysis.md build-report.log
git commit -m "docs: add bundle analysis report showing code splitting results"
```

---

## Success Criteria

✅ Main bundle reduced from 1.4 MB to <500 kB
✅ 8-10 code-split chunks created for pages and tabs
✅ All 160+ tests passing
✅ No TypeScript errors (npm run lint)
✅ Production build completes without warnings
✅ Lazy loading components render correctly on first interaction
✅ Git commits made for each major change
✅ No performance regression in app initialization

## Testing Strategy

1. **Build verification:** `npm run build` completes with expected chunk outputs
2. **Functional testing:** `npm test` - all existing tests pass
3. **Manual testing:** Verify each page/tab loads on click (async chunks load)
4. **Size validation:** Measure each chunk with build output
5. **Production preview:** `npm run preview` to test built app locally
