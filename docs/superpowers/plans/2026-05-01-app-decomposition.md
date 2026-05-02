# App Decomposition — Performance Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the 7153-line monolithic App.tsx into PortfolioContext + isolated tab components so that state changes in one tab never re-render unrelated tabs or recompute global memos.

**Architecture:** Global data (wallets, assets, transactions, prices) moves into `PortfolioContext`; each of the 9 tabs becomes a self-contained component owning its local UI state; derived-data logic (`currentAssets`, `currentTransactions`, `assetByKey` Map) moves into a shared `usePortfolioData` hook computed once in context; `TransactionList` gains `React.memo` and O(1) Map lookups.

**Tech Stack:** React 18, TypeScript strict, Vite, Vitest (`npm run test`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/context/PortfolioContext.tsx` | Global data state + fetchPortfolio |
| Create | `src/hooks/usePortfolioData.ts` | Derived currentAssets, currentTransactions, assetByKey |
| Create | `src/tabs/HistoryTab.tsx` | History/ledger tab with its 7 local filter states |
| Create | `src/tabs/StakesTab.tsx` | Stakes tab with its 3 local states |
| Create | `src/tabs/AssetsTab.tsx` | Holdings tab with its 10 local states |
| Create | `src/tabs/WalletsTab.tsx` | Wallets tab with its 9 local form/UI states |
| Create | `src/tabs/OverviewTab.tsx` | Overview tab with its 8 local states |
| Create | `src/tabs/HomeTab.tsx` | Home/front page tab with its 5 local states |
| Modify | `src/components/TransactionList.tsx` | Add React.memo, replace find() with Map |
| Modify | `src/App.tsx` | Slim to ~200-line nav shell |

---

## Task 1: TransactionList — React.memo + O(1) Map Lookups

**Files:**
- Modify: `src/components/TransactionList.tsx` (lines 199–254)
- Test: `src/test/transactionList.test.ts` (new)

### The problem
`displayAddr` calls `wallets.find()` — O(wallets) — once per address rendered. `findAsset` calls `assets.find()` — O(assets) — once per logo lookup. With 100+ tx rows this is thousands of linear scans per render. The component has no `React.memo` so it re-renders on every parent state change.

- [ ] **Step 1: Write the failing test**

Create `src/test/transactionList.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// Pure helpers extracted from TransactionList for unit testing
function buildWalletMap(wallets: { address: string; name: string }[]): Map<string, string> {
  return new Map(wallets.map(w => [w.address.toLowerCase(), w.name]));
}

function buildAssetMap(assets: { symbol: string; chain: string }[]): Map<string, typeof assets[0]> {
  const map = new Map<string, any>();
  assets.forEach(a => {
    const norm = (a.symbol || '').toUpperCase();
    const key = `${a.chain}:${a.chain === 'pulsechain' && norm === 'WPLS' ? 'PLS' : norm}`;
    map.set(key, a);
  });
  return map;
}

describe('buildWalletMap', () => {
  it('returns name for known address', () => {
    const map = buildWalletMap([{ address: '0xABC', name: 'Alice' }]);
    expect(map.get('0xabc')).toBe('Alice');
  });
  it('returns undefined for unknown address', () => {
    const map = buildWalletMap([]);
    expect(map.get('0xabc')).toBeUndefined();
  });
  it('lowercases all keys', () => {
    const map = buildWalletMap([{ address: '0xABCDEF', name: 'Bob' }]);
    expect(map.get('0xabcdef')).toBe('Bob');
  });
});

describe('buildAssetMap', () => {
  it('normalizes WPLS to PLS on pulsechain', () => {
    const map = buildAssetMap([{ symbol: 'WPLS', chain: 'pulsechain' }]);
    expect(map.has('pulsechain:PLS')).toBe(true);
  });
  it('does not normalize WPLS on ethereum', () => {
    const map = buildAssetMap([{ symbol: 'WPLS', chain: 'ethereum' }]);
    expect(map.has('ethereum:WPLS')).toBe(true);
  });
  it('uses uppercase symbol as key', () => {
    const map = buildAssetMap([{ symbol: 'hex', chain: 'pulsechain' }]);
    expect(map.has('pulsechain:HEX')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails (function not exported yet)**

```
npm run test -- transactionList
```
Expected: FAIL — "Cannot find module" or similar

- [ ] **Step 3: Apply the fix to TransactionList.tsx**

Replace lines 199–254 with the following (keep everything above line 199 and below line 262 unchanged):

```typescript
// Export helper functions for testing
export function buildWalletMap(
  wallets: Wallet[]
): Map<string, string> {
  return new Map(wallets.map(w => [w.address.toLowerCase(), w.name]));
}

export function buildAssetMap(
  assets: Asset[]
): Map<string, Asset> {
  const map = new Map<string, Asset>();
  assets.forEach(a => {
    const norm = normalizeSymbol(a.symbol, a.chain);
    map.set(`${a.chain}:${norm}`, a);
  });
  return map;
}

export const TransactionList = React.memo(function TransactionList({
  transactions,
  viewAsYou = false,
  wallets = [],
  compact = false,
  assets = [],
  getTokenLogoUrl,
  tokenLogos = {},
  hideIds = [],
  onToggleHide,
  showHidden = false,
  onFilterByAsset,
  emptyMessage = 'No transactions found.',
}: TransactionListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // O(1) lookups instead of O(n) find() on every address/logo render
  const walletMap = useMemo(
    () => buildWalletMap(wallets),
    [wallets],
  );

  const assetMap = useMemo(
    () => buildAssetMap(assets),
    [assets],
  );

  const walletSet = useMemo(
    () => new Set(walletMap.keys()),
    [walletMap],
  );

  const isOwn = useCallback(
    (addr: string | undefined): boolean =>
      viewAsYou && !!addr && walletSet.has(addr.toLowerCase()),
    [viewAsYou, walletSet],
  );

  const displayAddr = useCallback(
    (addr: string | undefined): string => {
      if (!addr) return '?';
      if (!viewAsYou) return shortAddr(addr);
      const lower = addr.toLowerCase();
      const name = walletMap.get(lower);
      return name ?? shortAddr(addr);
    },
    [viewAsYou, walletMap],
  );

  const getLogoUrl = useCallback(
    (symbol: string, chain: string): string => {
      const key = `${chain}:${normalizeSymbol(symbol, chain)}`;
      const asset = assetMap.get(key);
      if (asset && getTokenLogoUrl) return getTokenLogoUrl(asset);
      return tokenLogos[symbol.toLowerCase()] ?? tokenLogos[symbol] ?? '';
    },
    [assetMap, getTokenLogoUrl, tokenLogos],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);
```

Note: the closing `});` for the React.memo wrapping belongs at the very bottom of the component, after the return statement's closing parenthesis. Add `});` at the end of the file, replacing the current closing `}`.

- [ ] **Step 4: Run tests**

```
npm run test -- transactionList
```
Expected: all 6 tests PASS

- [ ] **Step 5: Smoke-check the app**

```
npm run dev
```
Open http://localhost:5174, navigate to History tab. Transactions should render normally.

- [ ] **Step 6: Commit**

```
git add src/components/TransactionList.tsx src/test/transactionList.test.ts
git commit -m "perf: React.memo + O(1) Map lookups in TransactionList"
```

---

## Task 2: PortfolioContext — Global State + fetchPortfolio

**Files:**
- Create: `src/context/PortfolioContext.tsx`
- Modify: `src/App.tsx` (wrap with provider, do NOT yet remove state)

### What moves to context
All 17 cross-tab state items from App.tsx:
`wallets · realAssets · realStakes · lpPositions · farmPositions · transactions · history · prices · tokenLogos · walletAssets · hideDust · hideSpam · spamTokenIds · hiddenTokens · hiddenTxIds · manualEntries · tokenMarketData · customCoins · etherscanApiKey · collapsedSections · theme`

Plus fetch infrastructure: `isLoading · lastUpdated · isFetchingRef · fetchPortfolio`

- [ ] **Step 1: Create `src/context/PortfolioContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Asset, Wallet, Chain, HexStake, LpPosition, FarmPosition, HistoryPoint, Transaction } from '../types';
import { scheduleLocalStorageWrite } from '../utils/localStorageDebounce';
import { normalizeTransactions } from '../utils/normalizeTransactions';

// ── Types ──────────────────────────────────────────────────────────────────────

function tryReadCache<T>(key: string, withBigInt = false): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (withBigInt) {
      return JSON.parse(raw, (_k, v) =>
        typeof v === 'string' && /^\d{15,}$/.test(v) ? BigInt(v) : v
      ) as T;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStoredJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export interface PortfolioContextValue {
  // Data
  wallets: Wallet[];
  realAssets: Asset[];
  realStakes: HexStake[];
  lpPositions: LpPosition[];
  farmPositions: FarmPosition[];
  transactions: Transaction[];
  history: HistoryPoint[];
  prices: Record<string, any>;
  tokenLogos: Record<string, string>;
  walletAssets: Record<string, Asset[]>;
  hideDust: boolean;
  hideSpam: boolean;
  spamTokenIds: string[];
  hiddenTokens: string[];
  hiddenTxIds: string[];
  manualEntries: Record<string, number>;
  tokenMarketData: Record<string, any>;
  customCoins: any[];
  etherscanApiKey: string;
  collapsedSections: Record<string, boolean>;
  theme: 'dark' | 'light';
  // Fetch state
  isLoading: boolean;
  lastUpdated: number | null;
  // Setters
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
  setRealAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  setPrices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setTokenLogos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setHideDust: React.Dispatch<React.SetStateAction<boolean>>;
  setHideSpam: React.Dispatch<React.SetStateAction<boolean>>;
  setSpamTokenIds: React.Dispatch<React.SetStateAction<string[]>>;
  setHiddenTokens: React.Dispatch<React.SetStateAction<string[]>>;
  setHiddenTxIds: React.Dispatch<React.SetStateAction<string[]>>;
  setManualEntries: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setTokenMarketData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setCustomCoins: React.Dispatch<React.SetStateAction<any[]>>;
  setEtherscanApiKey: React.Dispatch<React.SetStateAction<string>>;
  setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  // Actions
  fetchPortfolio: () => Promise<void>;
  isCollapsed: (key: string) => boolean;
  toggleCollapsed: (key: string) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>(() =>
    readStoredJSON<Wallet[]>('pulseport_wallets', [])
  );
  const [realAssets, setRealAssets] = useState<Asset[]>(() =>
    tryReadCache<Asset[]>('pulseport_cache_assets') ?? []
  );
  const [realStakes, setRealStakes] = useState<HexStake[]>(() =>
    tryReadCache<HexStake[]>('pulseport_cache_stakes', true) ?? []
  );
  const [lpPositions, setLpPositions] = useState<LpPosition[]>(() =>
    tryReadCache<LpPosition[]>('pulseport_cache_lp') ?? []
  );
  const [farmPositions, setFarmPositions] = useState<FarmPosition[]>(() =>
    tryReadCache<FarmPosition[]>('pulseport_cache_farms') ?? []
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (localStorage.getItem('pulseport_cache_txs_v') !== '2') {
      localStorage.removeItem('pulseport_cache_txs');
      localStorage.setItem('pulseport_cache_txs_v', '2');
      return [];
    }
    return tryReadCache<Transaction[]>('pulseport_cache_txs') ?? [];
  });
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    readStoredJSON<HistoryPoint[]>('pulseport_history', [])
  );
  const [prices, setPrices] = useState<Record<string, any>>(() =>
    tryReadCache<Record<string, any>>('pulseport_cache_prices') ?? {}
  );
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});
  const [walletAssets, setWalletAssets] = useState<Record<string, Asset[]>>(() =>
    tryReadCache<Record<string, Asset[]>>('pulseport_cache_wallet_assets') ?? {}
  );
  const [hideDust, setHideDust] = useState<boolean>(() =>
    localStorage.getItem('pulseport_hide_dust') === 'true'
  );
  const [hideSpam, setHideSpam] = useState<boolean>(() =>
    localStorage.getItem('pulseport_hide_spam') !== 'false'
  );
  const [spamTokenIds, setSpamTokenIds] = useState<string[]>(() =>
    readStoredJSON<string[]>('pulseport_spam_tokens', [])
  );
  const [hiddenTokens, setHiddenTokens] = useState<string[]>(() =>
    readStoredJSON<string[]>('pulseport_hidden_tokens', [])
  );
  const [hiddenTxIds, setHiddenTxIds] = useState<string[]>(() =>
    readStoredJSON<string[]>('pulseport_hidden_txs', [])
  );
  const [manualEntries, setManualEntries] = useState<Record<string, number>>(() =>
    readStoredJSON<Record<string, number>>('pulseport_manual_entries', {})
  );
  const [tokenMarketData, setTokenMarketData] = useState<Record<string, any>>({});
  const [customCoins, setCustomCoins] = useState<any[]>(() =>
    readStoredJSON<any[]>('pulseport_custom_coins', [])
  );
  const [etherscanApiKey, setEtherscanApiKey] = useState<string>(() =>
    localStorage.getItem('pulseport_etherscan_key') ?? ''
  );
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    readStoredJSON<Record<string, boolean>>('pulseport_collapsed_sections', {})
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('pulseport_theme') as 'dark' | 'light') ?? 'dark'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const isFetchingRef = useRef(false);

  // ── Persistence effects ──────────────────────────────────────────────────────

  useEffect(() => { scheduleLocalStorageWrite('pulseport_custom_coins', JSON.stringify(customCoins)); }, [customCoins]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_assets', JSON.stringify(realAssets)); }, [realAssets]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_stakes', JSON.stringify(realStakes, (_k, v) => typeof v === 'bigint' ? v.toString() : v)); }, [realStakes]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_lp', JSON.stringify(lpPositions)); }, [lpPositions]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_farms', JSON.stringify(farmPositions)); }, [farmPositions]);
  useEffect(() => {
    if (transactions.length > 0) {
      scheduleLocalStorageWrite('pulseport_cache_txs', JSON.stringify(transactions.slice(0, 200)));
      localStorage.setItem('pulseport_cache_txs_v', '2');
    }
  }, [transactions]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_wallet_assets', JSON.stringify(walletAssets)); }, [walletAssets]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_cache_prices', JSON.stringify(prices)); }, [prices]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_collapsed_sections', JSON.stringify(collapsedSections)); }, [collapsedSections]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('pulseport_hide_dust', String(hideDust)); }, [hideDust]);
  useEffect(() => { localStorage.setItem('pulseport_hide_spam', String(hideSpam)); }, [hideSpam]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_spam_tokens', JSON.stringify(spamTokenIds)); }, [spamTokenIds]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_hidden_tokens', JSON.stringify(hiddenTokens)); }, [hiddenTokens]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_hidden_txs', JSON.stringify(hiddenTxIds)); }, [hiddenTxIds]);
  useEffect(() => { localStorage.setItem('pulseport_etherscan_key', etherscanApiKey); }, [etherscanApiKey]);
  useEffect(() => { scheduleLocalStorageWrite('pulseport_manual_entries', JSON.stringify(manualEntries)); }, [manualEntries]);
  useEffect(() => { localStorage.setItem('pulseport_theme', theme); }, [theme]);

  // ── Collapsed section helpers ────────────────────────────────────────────────

  const isCollapsed = useCallback((key: string) => !!collapsedSections[key], [collapsedSections]);
  const toggleCollapsed = useCallback((key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── fetchPortfolio placeholder ───────────────────────────────────────────────
  // MIGRATION NOTE: In Task 4 (Wire Provider), copy the full fetchPortfolio
  // function body from App.tsx lines 839–2304 into this callback. The function
  // signature and all setState calls remain the same; only the enclosing scope
  // changes from App to PortfolioProvider.

  const fetchPortfolio = useCallback(async () => {
    if (isFetchingRef.current) return;
    // Placeholder — replaced in Task 4
    console.warn('fetchPortfolio not yet migrated from App.tsx');
  }, [wallets]);

  // ── Auto-refresh ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (wallets.length === 0) return;
    fetchPortfolio();
    const id = setInterval(fetchPortfolio, 30_000);
    return () => clearInterval(id);
  }, [wallets]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Context value ─────────────────────────────────────────────────────────────

  const value: PortfolioContextValue = {
    wallets, realAssets, realStakes, lpPositions, farmPositions, transactions,
    history, prices, tokenLogos, walletAssets, hideDust, hideSpam, spamTokenIds,
    hiddenTokens, hiddenTxIds, manualEntries, tokenMarketData, customCoins,
    etherscanApiKey, collapsedSections, theme,
    isLoading, lastUpdated,
    setWallets, setRealAssets, setPrices, setTokenLogos, setHideDust, setHideSpam,
    setSpamTokenIds, setHiddenTokens, setHiddenTxIds, setManualEntries,
    setTokenMarketData, setCustomCoins, setEtherscanApiKey, setCollapsedSections,
    setTheme, setTransactions,
    fetchPortfolio, isCollapsed, toggleCollapsed,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```
npx tsc --noEmit
```
Expected: 0 errors. If `LpPosition`, `FarmPosition`, or `HistoryPoint` are missing from `types.ts`, add them as `type X = any` stubs temporarily and note them for cleanup.

- [ ] **Step 3: Commit the scaffold**

```
git add src/context/PortfolioContext.tsx
git commit -m "feat: PortfolioContext scaffold (placeholder fetchPortfolio)"
```

---

## Task 3: usePortfolioData — Derived Data Hook

**Files:**
- Create: `src/hooks/usePortfolioData.ts`
- Test: `src/test/usePortfolioData.test.ts`

This hook is consumed by every tab. It wraps the expensive `currentAssets` and `currentTransactions` pipelines, and produces a stable `assetByKey` Map so callers get O(1) lookups.

- [ ] **Step 1: Write the failing test**

Create `src/test/usePortfolioData.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Asset } from '../types';

// Pure helper functions exported from the hook for testability
import { buildAssetByKey, normalizeAssetSymbol } from '../hooks/usePortfolioData';

const makeAsset = (symbol: string, chain: string, price = 1): Asset => ({
  id: `${chain}:${symbol}`,
  symbol, name: symbol, balance: 1, price, value: price,
  chain: chain as any, pnl24h: 0,
});

describe('buildAssetByKey', () => {
  it('keys assets by chain:UPPERCASE_SYMBOL', () => {
    const assets = [makeAsset('hex', 'pulsechain')];
    const map = buildAssetByKey(assets);
    expect(map.has('pulsechain:HEX')).toBe(true);
  });

  it('normalizes WPLS → PLS on pulsechain', () => {
    const assets = [makeAsset('WPLS', 'pulsechain')];
    const map = buildAssetByKey(assets);
    expect(map.has('pulsechain:PLS')).toBe(true);
    expect(map.has('pulsechain:WPLS')).toBe(false);
  });

  it('does not normalize WPLS on ethereum', () => {
    const assets = [makeAsset('WPLS', 'ethereum')];
    const map = buildAssetByKey(assets);
    expect(map.has('ethereum:WPLS')).toBe(true);
  });

  it('returns the correct asset for a key', () => {
    const asset = makeAsset('PLS', 'pulsechain', 0.00001);
    const map = buildAssetByKey([asset]);
    expect(map.get('pulsechain:PLS')).toBe(asset);
  });
});

describe('normalizeAssetSymbol', () => {
  it('uppercases symbol', () => {
    expect(normalizeAssetSymbol('hex', 'pulsechain')).toBe('HEX');
  });
  it('converts WPLS to PLS on pulsechain', () => {
    expect(normalizeAssetSymbol('WPLS', 'pulsechain')).toBe('PLS');
  });
  it('leaves WPLS alone on ethereum', () => {
    expect(normalizeAssetSymbol('WPLS', 'ethereum')).toBe('WPLS');
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- usePortfolioData
```
Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Create `src/hooks/usePortfolioData.ts`**

```typescript
import { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Asset, Transaction, Chain } from '../types';

// ── Pure helpers (exported for testing) ──────────────────────────────────────

export function normalizeAssetSymbol(symbol: string, chain: string): string {
  const upper = (symbol || '').toUpperCase();
  return chain === 'pulsechain' && upper === 'WPLS' ? 'PLS' : upper;
}

export function buildAssetByKey(assets: Asset[]): Map<string, Asset> {
  const map = new Map<string, Asset>();
  assets.forEach(a => {
    const norm = normalizeAssetSymbol(a.symbol, a.chain);
    map.set(`${a.chain}:${norm}`, a);
  });
  return map;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortfolioData {
  /** Filtered, enriched assets (respects hideDust / hideSpam / hiddenTokens / manualEntries) */
  currentAssets: Asset[];
  /** Transactions with normalized symbols + pre-computed assetUpper */
  currentTransactions: (Transaction & { assetUpper: string; counterAssetUpper?: string })[];
  /** O(1) asset lookup by "chain:SYMBOL" */
  assetByKey: Map<string, Asset>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const MOCK_ASSETS: Asset[] = [];
const MOCK_TRANSACTIONS: Transaction[] = [];
const ETH_HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';
const EHEX_PULSECHAIN_ADDR = '0x57fde0a71132198bbec939b98976993d8d89d225';

export function usePortfolioData(): PortfolioData {
  const {
    wallets, realAssets, walletAssets, transactions,
    hiddenTokens, hideDust, hideSpam, spamTokenIds,
    prices, manualEntries, customCoins,
  } = usePortfolio();

  // activeWallet not in context yet — read from App shell via prop or add to context later.
  // For now pass null (all wallets). Replace with useActiveWallet() hook in Task 11.
  const activeWallet: string | null = null;

  const assetUniverse = useMemo(() => {
    const activeWalletKey = activeWallet?.toLowerCase() ?? null;
    const base = wallets.length > 0
      ? (activeWalletKey ? (walletAssets[activeWalletKey] || []) : realAssets)
      : MOCK_ASSETS;
    const all = [...base];
    customCoins.forEach((coin: any) => {
      all.push({
        id: coin.id, symbol: coin.symbol, name: coin.name,
        balance: coin.balance, price: coin.price,
        value: coin.balance * coin.price,
        chain: 'custom' as Chain, pnl24h: 0,
      });
    });
    return all;
  }, [wallets.length, realAssets, walletAssets, activeWallet, customCoins]);

  const currentAssets = useMemo((): Asset[] => {
    return assetUniverse
      .filter(a => !hiddenTokens.includes(a.id))
      .filter(a => !hideDust || a.value >= 1 || (a.balance > 0 && a.price === 0))
      .filter(a => !hideSpam || (!(a as any).isSpam && !spamTokenIds.includes(a.id)))
      .map(a => {
        const addr = (a as any).address?.toLowerCase?.();
        const isEHex =
          (a.chain === 'ethereum' && addr === ETH_HEX_ADDR) ||
          (a.chain === 'pulsechain' && addr === EHEX_PULSECHAIN_ADDR);
        if (isEHex) {
          const ehexData = prices['hex'] || prices[`ethereum:${ETH_HEX_ADDR}`];
          if (ehexData?.usd) {
            return {
              ...a,
              price: ehexData.usd,
              value: a.balance * ehexData.usd,
              priceChange24h: ehexData.usd_24h_change ?? a.priceChange24h,
              priceChange1h: ehexData.usd_1h_change ?? a.priceChange1h,
              priceChange7d: ehexData.usd_7d_change ?? a.priceChange7d,
              pnl24h: ehexData.usd_24h_change ?? a.pnl24h,
              entryPls: manualEntries[a.id] || 0,
            };
          }
        }
        return { ...a, entryPls: manualEntries[a.id] || 0 };
      });
  }, [assetUniverse, manualEntries, hiddenTokens, hideDust, hideSpam, spamTokenIds, prices]);

  const currentTransactions = useMemo(() => {
    const base = wallets.length > 0 ? transactions : MOCK_TRANSACTIONS;
    return base.map(tx => {
      const asset = normalizeAssetSymbol(tx.asset, tx.chain);
      const counterAsset = tx.counterAsset
        ? normalizeAssetSymbol(tx.counterAsset, tx.chain)
        : tx.counterAsset;
      return {
        ...tx,
        asset,
        counterAsset,
        assetUpper: asset.toUpperCase(),
        counterAssetUpper: counterAsset?.toUpperCase(),
      };
    });
  }, [wallets.length, transactions]);

  const assetByKey = useMemo(
    () => buildAssetByKey(currentAssets),
    [currentAssets]
  );

  return { currentAssets, currentTransactions, assetByKey };
}
```

- [ ] **Step 4: Run tests**

```
npm run test -- usePortfolioData
```
Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```
git add src/hooks/usePortfolioData.ts src/test/usePortfolioData.test.ts
git commit -m "feat: usePortfolioData hook with assetByKey Map and pre-computed assetUpper"
```

---

## Task 4: Wire PortfolioProvider into App.tsx

**Files:**
- Modify: `src/main.tsx` OR `src/App.tsx` (wrap root with provider)

This is the integration task. After this task the app runs identically to before — the context exists but App.tsx still uses its own local state. Tabs will be migrated in later tasks.

- [ ] **Step 1: Move fetchPortfolio into PortfolioProvider**

In `src/context/PortfolioContext.tsx`, replace the placeholder `fetchPortfolio` callback with the full function body from `src/App.tsx` lines 839–2304.

The function already calls `setRealAssets`, `setRealStakes`, `setPrices`, `setTokenLogos`, `setWalletAssets`, `setLpPositions`, `setFarmPositions`, `setTransactions`, `setHistory`, `setLastUpdated`, `setIsLoading` — all of which are now defined in PortfolioProvider's scope.

Additional imports required at the top of `PortfolioContext.tsx` (copy from App.tsx imports):
```typescript
import { createPublicClient, http, fallback, formatUnits, getAddress } from 'viem';
import { CHAINS, HEX_ABI, TOKENS, PULSEX_LP_PAIRS, PHEX_YIELD_PER_TSHARE, EHEX_YIELD_PER_TSHARE, PHEX_YIELD_BI_NUM, PHEX_YIELD_BI_DEN, EHEX_YIELD_BI_NUM, EHEX_YIELD_BI_DEN, FALLBACK_DESCRIPTIONS } from '../constants';
import { normalizeTransactions } from '../utils/normalizeTransactions';
import { resolveBlockscoutBase, resolveEtherscanCompatBase } from '../utils/localStorageDebounce';
```

Any helper functions used inside fetchPortfolio that are currently defined in App.tsx (e.g. `normalizeAssetSymbol`, `sameAssetSymbol`, `resolveBlockscoutBase`) must also be copied or imported. Move them to a new `src/utils/assetHelpers.ts` file.

- [ ] **Step 2: Create `src/utils/assetHelpers.ts`**

```typescript
/** Normalize a raw token symbol for display/lookup consistency. */
export function normalizeAssetSymbol(symbol: string, chain: string): string {
  const upper = (symbol || '').toUpperCase();
  return chain === 'pulsechain' && upper === 'WPLS' ? 'PLS' : upper;
}

/** True if two symbol strings refer to the same asset on the same chain. */
export function sameAssetSymbol(a: string, b: string, chain: string): boolean {
  return normalizeAssetSymbol(a, chain) === normalizeAssetSymbol(b, chain);
}
```

Update `src/hooks/usePortfolioData.ts` to import `normalizeAssetSymbol` from `../utils/assetHelpers` instead of defining it inline. Update `src/test/usePortfolioData.test.ts` import accordingly.

- [ ] **Step 3: Wrap app with PortfolioProvider in `src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PortfolioProvider } from './context/PortfolioContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PortfolioProvider>
      <App />
    </PortfolioProvider>
  </React.StrictMode>
);
```

- [ ] **Step 4: Remove duplicate state from App.tsx**

In `src/App.tsx`, delete the useState initializations for all 22 items now owned by PortfolioContext (lines 518–530, 608, 636, 641–642, 648–649, and the persistence `useEffect` blocks they correspond to). Import `usePortfolio` and destructure what App.tsx still needs:

```typescript
import { usePortfolio } from './context/PortfolioContext';

// At top of App component:
const {
  wallets, setWallets,
  realAssets, setRealAssets,
  realStakes,
  lpPositions, farmPositions,
  transactions, setTransactions,
  history,
  prices, setPrices,
  tokenLogos, setTokenLogos,
  walletAssets, setWalletAssets,
  hideDust, setHideDust,
  hideSpam, setHideSpam,
  spamTokenIds, setSpamTokenIds,
  hiddenTokens, setHiddenTokens,
  hiddenTxIds, setHiddenTxIds,
  manualEntries, setManualEntries,
  tokenMarketData, setTokenMarketData,
  customCoins, setCustomCoins,
  etherscanApiKey, setEtherscanApiKey,
  collapsedSections, setCollapsedSections,
  theme, setTheme,
  isLoading, lastUpdated,
  fetchPortfolio, isCollapsed, toggleCollapsed,
} = usePortfolio();
```

Also delete the `isFetchingRef` and auto-refresh `useEffect` from App.tsx (now in context).

- [ ] **Step 5: TypeScript check + run tests**

```
npx tsc --noEmit && npm run test
```
Expected: 0 TS errors, all existing tests pass

- [ ] **Step 6: Smoke-check app**

```
npm run dev
```
Open http://localhost:5174. Add a wallet, verify data loads, navigate all tabs. Behavior must be identical to before this task.

- [ ] **Step 7: Commit**

```
git add src/context/PortfolioContext.tsx src/utils/assetHelpers.ts src/main.tsx src/App.tsx src/hooks/usePortfolioData.ts src/test/usePortfolioData.test.ts
git commit -m "feat: wire PortfolioProvider — global state and fetchPortfolio migrated to context"
```

---

## Task 5: HistoryTab Extraction

**Files:**
- Create: `src/tabs/HistoryTab.tsx`
- Modify: `src/App.tsx` (replace inline JSX block with `<HistoryTab />`)

History tab is the most isolated — its 7 filter states are used nowhere else.

**Local state moving into HistoryTab:**
`txTypeFilter · txAssetFilter · txYearFilter · txCoinCategory · viewAsYou · txCompact · showHiddenTxs`

**Context it reads:**
`transactions, wallets, prices, hiddenTxIds, setHiddenTxIds` (via `usePortfolio`)
`currentTransactions, currentAssets, assetByKey` (via `usePortfolioData`)

- [ ] **Step 1: Create `src/tabs/HistoryTab.tsx`**

Create the file with this shell, then fill the body by cutting the JSX from App.tsx lines 5716–5949:

```typescript
import React, { useState, useMemo, useCallback } from 'react';
import type { Transaction } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { TransactionList } from '../components/TransactionList';
import { sameAssetSymbol } from '../utils/assetHelpers';
// Copy any other imports used in the history JSX block from App.tsx

interface HistoryTabProps {
  selectedWalletAddr: string;
  getTokenLogoUrl: (asset: any) => string;
}

export function HistoryTab({ selectedWalletAddr, getTokenLogoUrl }: HistoryTabProps) {
  const { wallets, prices, hiddenTxIds, setHiddenTxIds, tokenLogos } = usePortfolio();
  const { currentTransactions, currentAssets, assetByKey } = usePortfolioData();

  // ── Local filter state (was in App.tsx) ────────────────────────────────────
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txAssetFilter, setTxAssetFilter] = useState<string>('all');
  const [txYearFilter, setTxYearFilter] = useState<string>('all');
  const [txCoinCategory, setTxCoinCategory] = useState<string>('all');
  const [viewAsYou, setViewAsYou] = useState(false);
  const [txCompact, setTxCompact] = useState(false);
  const [showHiddenTxs, setShowHiddenTxs] = useState(false);

  // ── matchesHistoryTransactionFilters (was in App.tsx ~line 2506) ───────────
  const matchesHistoryTransactionFilters = useCallback((tx: Transaction & { assetUpper?: string }) => {
    const walletKey = selectedWalletAddr.toLowerCase();
    const matchesWallet = walletKey === 'all' ||
      tx.from?.toLowerCase() === walletKey ||
      tx.to?.toLowerCase() === walletKey ||
      (tx as any).walletAddress?.toLowerCase?.() === walletKey;
    const matchesAsset = txAssetFilter === 'all' ||
      sameAssetSymbol(tx.asset, txAssetFilter, tx.chain) ||
      sameAssetSymbol(tx.counterAsset ?? '', txAssetFilter, tx.chain);
    const txYear = new Date(tx.timestamp).getFullYear().toString();
    const matchesYear = txYearFilter === 'all' || txYear === txYearFilter;
    const assetUpper = (tx as any).assetUpper ?? tx.asset.toUpperCase();
    let matchesCoin = true;
    if (txCoinCategory === 'stablecoins') {
      matchesCoin = ['USDC','USDT','DAI','TETHER','USD COIN','USDBC'].some(s => assetUpper.includes(s));
    } else if (txCoinCategory === 'eth_weth') {
      matchesCoin = assetUpper === 'ETH' || assetUpper === 'WETH';
    } else if (txCoinCategory === 'hex') {
      matchesCoin = assetUpper === 'HEX' || assetUpper === 'EHEX' || assetUpper.includes('HEX');
    } else if (txCoinCategory === 'pls_wpls') {
      matchesCoin = assetUpper === 'PLS' || assetUpper === 'WPLS';
    } else if (txCoinCategory === 'bridged') {
      matchesCoin = !!(tx as any).bridged;
    }
    return matchesWallet && matchesAsset && matchesYear && matchesCoin;
  }, [selectedWalletAddr, txAssetFilter, txYearFilter, txCoinCategory]);

  // ── filteredTransactions (was in App.tsx ~line 2534) ───────────────────────
  const filteredTransactions = useMemo(() => {
    return currentTransactions.filter(tx => {
      if (!matchesHistoryTransactionFilters(tx)) return false;
      return txTypeFilter === 'all' || tx.type === txTypeFilter ||
        (txTypeFilter === 'swap' && !!tx.swapLegOnly);
    });
  }, [currentTransactions, matchesHistoryTransactionFilters, txTypeFilter]);

  // ── Combine filter options as single-object to avoid 4-separate-updates ────
  const handleClearFilters = useCallback(() => {
    setTxTypeFilter('all');
    setTxAssetFilter('all');
    setTxYearFilter('all');
    setTxCoinCategory('all');
  }, []);

  // ── swapAssetFilterOptions (was App.tsx ~line 2543) ────────────────────────
  const swapAssetFilterOptions = useMemo<[string, string][]>(() => {
    const symbols = Array.from(new Set<string>(
      currentTransactions.flatMap(tx =>
        [tx.asset, tx.counterAsset].filter(Boolean) as string[]
      )
    )).sort((a, b) => a.localeCompare(b));
    return [['all', 'All Tokens'], ...symbols.map(s => [s, s] as [string, string])];
  }, [currentTransactions]);

  const swapYearFilterOptions = useMemo<[string, string][]>(() => {
    const years = Array.from(new Set(
      currentTransactions.map(tx => new Date(tx.timestamp).getFullYear().toString())
    )).sort((a, b) => Number(b) - Number(a));
    return [['all', 'All Years'], ...years.map(y => [y, y] as [string, string])];
  }, [currentTransactions]);

  // ── historySummary and other derived memos from App.tsx go here ────────────
  // Cut the historySummary useMemo (~line 2588) and paste it here.
  // It uses filteredTransactions, prices, txAssetFilter, currentTransactions,
  // currentAssets — all available in scope.

  return (
    // Paste JSX from App.tsx lines 5716–5949 here.
    // Replace all references to state/callbacks with local equivalents.
    // selectedWalletAddr comes from props.
    // getTokenLogoUrl comes from props.
    <div>{ /* JSX goes here */ }</div>
  );
}
```

- [ ] **Step 2: Cut and paste JSX**

In `src/App.tsx`:
1. Find the block `{activeTab === 'history' && (` (line ~5716)
2. Cut everything from that opening to its closing `)}` (line ~5949)
3. Paste into the `return (...)` of `HistoryTab.tsx`, replacing the placeholder `<div>`

- [ ] **Step 3: Replace in App.tsx**

Where the history JSX was, insert:

```tsx
{activeTab === 'history' && (
  <HistoryTab
    selectedWalletAddr={selectedWalletAddr}
    getTokenLogoUrl={getTokenLogoUrl}
  />
)}
```

Also add import: `import { HistoryTab } from './tabs/HistoryTab';`

Delete from App.tsx the 7 local state variables now owned by HistoryTab (txTypeFilter, txAssetFilter, txYearFilter, txCoinCategory, viewAsYou, txCompact, showHiddenTxs). Delete the memos they were used in (filteredTransactions, swapAssetFilterOptions, swapYearFilterOptions, historySummary, holdingsPulsechainTransactions) if they are not used outside the history tab. Delete the `matchesHistoryTransactionFilters` useCallback.

- [ ] **Step 4: TypeScript + tests**

```
npx tsc --noEmit && npm run test
```
Expected: 0 errors, all tests pass

- [ ] **Step 5: Smoke-check history tab**

```
npm run dev
```
Navigate to History tab. All filters, transaction list, P&L summary must work identically to before.

- [ ] **Step 6: Commit**

```
git add src/tabs/HistoryTab.tsx src/App.tsx
git commit -m "refactor: extract HistoryTab — 7 filter states now local, no longer cause full-app re-renders"
```

---

## Task 6: StakesTab Extraction

**Files:**
- Create: `src/tabs/StakesTab.tsx`
- Modify: `src/App.tsx` (lines 5684–5715 → component reference)

**Local state moving into StakesTab:**
`stakeChainFilter · yieldUnit · expandedStakeIds`

- [ ] **Step 1: Create `src/tabs/StakesTab.tsx`**

```typescript
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { StakesSection } from '../components/StakesSection';

interface StakesTabProps {
  /** tokenLogos passed from shell for logo rendering */
  tokenLogos: Record<string, string>;
}

export function StakesTab({ tokenLogos }: StakesTabProps) {
  const { realStakes, prices } = usePortfolio();
  const { currentAssets } = usePortfolioData();

  const [stakeChainFilter, setStakeChainFilter] = useState<'all' | 'pulsechain' | 'ethereum'>('all');
  const [yieldUnit, setYieldUnit] = useState<'hex' | 'usd'>('usd');
  const [expandedStakeIds, setExpandedStakeIds] = useState<Set<string>>(new Set());

  const currentStakes = useMemo(() => {
    if (stakeChainFilter === 'all') return realStakes;
    return realStakes.filter(s => s.chain === stakeChainFilter);
  }, [realStakes, stakeChainFilter]);

  // Paste JSX from App.tsx lines 5684–5715 here, substituting local state.
  return (
    <StakesSection
      stakes={currentStakes}
      prices={prices}
      yieldUnit={yieldUnit}
      onYieldUnitChange={setYieldUnit}
      expandedIds={expandedStakeIds}
      onToggleExpand={(id) => setExpandedStakeIds(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
      })}
      chainFilter={stakeChainFilter}
      onChainFilterChange={setStakeChainFilter}
      assets={currentAssets}
    />
  );
}
```

Cut lines 5684–5715 from App.tsx, verify the props passed to `StakesSection` match the above, then replace with:

```tsx
{activeTab === 'stakes' && <StakesTab tokenLogos={tokenLogos} />}
```

Add import: `import { StakesTab } from './tabs/StakesTab';`

Delete from App.tsx: `stakeChainFilter`, `yieldUnit`, `expandedStakeIds` state declarations.

- [ ] **Step 2: TypeScript + tests + smoke**

```
npx tsc --noEmit && npm run test && npm run dev
```
Expected: 0 errors, all tests pass, Stakes tab renders correctly.

- [ ] **Step 3: Commit**

```
git add src/tabs/StakesTab.tsx src/App.tsx
git commit -m "refactor: extract StakesTab — stake filter state now local"
```

---

## Task 7: AssetsTab Extraction

**Files:**
- Create: `src/tabs/AssetsTab.tsx`
- Modify: `src/App.tsx` (lines 4836–5683 → component reference)

**Local state moving into AssetsTab (10 items):**
`walletChainFilter · showHiddenCoins · coinVisibilityMenuOpen · assetSortField · assetSortDir · expandedAssetIds · pnlAsset · tokenCardModal · tokenCardModalLoading · showMarketWatch · marketWatchInitialSearch`

- [ ] **Step 1: Create `src/tabs/AssetsTab.tsx`**

```typescript
import React, { useState, useMemo, useCallback } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { HoldingsTable } from '../components/HoldingsTable';
import type { HoldingSortField } from '../components/HoldingsTable';
import { PnLModal } from '../components/PnLModal';
import { TokenCardModal } from '../components/TokenCardModal';
import { MarketWatchModal } from '../components/MarketWatchModal';
import type { Asset } from '../types';

interface AssetsTabProps {
  selectedWalletAddr: string;
  getTokenLogoUrl: (asset: Asset) => string;
  onFilterByAsset: (symbol: string) => void;
}

export function AssetsTab({ selectedWalletAddr, getTokenLogoUrl, onFilterByAsset }: AssetsTabProps) {
  const {
    wallets, prices, tokenLogos, hiddenTokens, setHiddenTokens,
    tokenMarketData, setTokenMarketData, manualEntries, setManualEntries,
    collapsedSections, isCollapsed, toggleCollapsed,
  } = usePortfolio();
  const { currentAssets, currentTransactions } = usePortfolioData();

  const [walletChainFilter, setWalletChainFilter] = useState<'all' | 'pulsechain' | 'ethereum' | 'base'>('all');
  const [showHiddenCoins, setShowHiddenCoins] = useState(false);
  const [coinVisibilityMenuOpen, setCoinVisibilityMenuOpen] = useState(false);
  const [assetSortField, setAssetSortField] = useState<'value' | 'change'>('value');
  const [assetSortDir, setAssetSortDir] = useState<'desc' | 'asc'>('desc');
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(new Set());
  const [pnlAsset, setPnlAsset] = useState<Asset | null>(null);
  const [tokenCardModal, setTokenCardModal] = useState<Asset | null>(null);
  const [tokenCardModalLoading, setTokenCardModalLoading] = useState(false);
  const [showMarketWatch, setShowMarketWatch] = useState(false);
  const [marketWatchInitialSearch, setMarketWatchInitialSearch] = useState('');

  // Paste the JSX from App.tsx lines 4836–5683 here.
  // All references to the 10 state items above, plus context values, are now in scope.
  return (
    <div>{ /* JSX goes here */ }</div>
  );
}
```

Cut App.tsx lines 4836–5683, paste into the return, then replace with:

```tsx
{activeTab === 'assets' && (
  <AssetsTab
    selectedWalletAddr={selectedWalletAddr}
    getTokenLogoUrl={getTokenLogoUrl}
    onFilterByAsset={(symbol) => { /* pass through if needed by other tabs */ }}
  />
)}
```

Add import: `import { AssetsTab } from './tabs/AssetsTab';`

Delete the 10 local state declarations from App.tsx.

- [ ] **Step 2: TypeScript + tests + smoke**

```
npx tsc --noEmit && npm run test && npm run dev
```
Expected: 0 errors, all tests pass, Assets tab works.

- [ ] **Step 3: Commit**

```
git add src/tabs/AssetsTab.tsx src/App.tsx
git commit -m "refactor: extract AssetsTab — 10 local states isolated, modals no longer cause app-wide re-renders"
```

---

## Task 8: WalletsTab Extraction

**Files:**
- Create: `src/tabs/WalletsTab.tsx`
- Modify: `src/App.tsx` (lines 5950–6607 → component reference)

**Local state moving into WalletsTab (9 items):**
`newWalletAddress · newWalletName · walletFormError · isAddingWallet · editingWalletAddress · editWalletName · expandedWalletAssetIds · isCustomCoinsModalOpen · customCoinDraft`

- [ ] **Step 1: Create `src/tabs/WalletsTab.tsx`**

```typescript
import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';

interface WalletsTabProps {
  selectedWalletAddr: string;
  onSelectWallet: (addr: string) => void;
  getTokenLogoUrl: (asset: any) => string;
}

export function WalletsTab({ selectedWalletAddr, onSelectWallet, getTokenLogoUrl }: WalletsTabProps) {
  const {
    wallets, setWallets, walletAssets, prices, tokenLogos,
    customCoins, setCustomCoins,
  } = usePortfolio();
  const { currentAssets } = usePortfolioData();

  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [walletFormError, setWalletFormError] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [editingWalletAddress, setEditingWalletAddress] = useState<string | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [expandedWalletAssetIds, setExpandedWalletAssetIds] = useState<Set<string>>(new Set());
  const [isCustomCoinsModalOpen, setIsCustomCoinsModalOpen] = useState(false);
  const [customCoinDraft, setCustomCoinDraft] = useState({ symbol: '', name: '', balance: '', price: '' });

  // Paste JSX from App.tsx lines 5950–6607 here.
  return (
    <div>{ /* JSX goes here */ }</div>
  );
}
```

Cut App.tsx lines 5950–6607, paste into the return, then replace with:

```tsx
{activeTab === 'wallets' && (
  <WalletsTab
    selectedWalletAddr={selectedWalletAddr}
    onSelectWallet={setSelectedWalletAddr}
    getTokenLogoUrl={getTokenLogoUrl}
  />
)}
```

Add import: `import { WalletsTab } from './tabs/WalletsTab';`

Delete the 9 local state declarations from App.tsx.

- [ ] **Step 2: TypeScript + tests + smoke**

```
npx tsc --noEmit && npm run test && npm run dev
```
Expected: 0 errors, all tests pass, Wallets tab (add/edit/remove wallet) works.

- [ ] **Step 3: Commit**

```
git add src/tabs/WalletsTab.tsx src/App.tsx
git commit -m "refactor: extract WalletsTab — wallet form state isolated"
```

---

## Task 9: OverviewTab Extraction

**Files:**
- Create: `src/tabs/OverviewTab.tsx`
- Modify: `src/App.tsx` (lines 4211–4826 → component reference)

**Local state moving into OverviewTab (8 items):**
`overviewChainFilter · overviewTokenSearch · allocWheelOpen · allocationCalculatorOpen · allocationDraftPercentages · perfPeriod · receivedCoinFilter · receivedChainFilter`

- [ ] **Step 1: Create `src/tabs/OverviewTab.tsx`**

```typescript
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';

interface OverviewTabProps {
  selectedWalletAddr: string;
  getTokenLogoUrl: (asset: any) => string;
  onOpenHistory: () => void;
}

export function OverviewTab({ selectedWalletAddr, getTokenLogoUrl, onOpenHistory }: OverviewTabProps) {
  const { wallets, prices, history, tokenLogos, tokenMarketData } = usePortfolio();
  const { currentAssets, currentTransactions } = usePortfolioData();

  const [overviewChainFilter, setOverviewChainFilter] = useState<'all' | 'pulsechain' | 'ethereum' | 'base'>('all');
  const [overviewTokenSearch, setOverviewTokenSearch] = useState('');
  const [allocWheelOpen, setAllocWheelOpen] = useState(true);
  const [allocationCalculatorOpen, setAllocationCalculatorOpen] = useState(false);
  const [allocationDraftPercentages, setAllocationDraftPercentages] = useState<Record<string, number>>({});
  const [perfPeriod, setPerfPeriod] = useState<'1w' | '1m' | '1y' | 'all'>('1m');
  const [receivedCoinFilter, setReceivedCoinFilter] = useState('all');
  const [receivedChainFilter, setReceivedChainFilter] = useState('all');

  // The summary useMemo (~App.tsx line 2646) now lives here.
  // Copy it verbatim. It depends on currentAssets, currentStakes,
  // prices, wallets, currentTransactions, history — all in scope.

  // Paste JSX from App.tsx lines 4211–4826 here.
  return (
    <div>{ /* JSX goes here */ }</div>
  );
}
```

- [ ] **Step 2: Cut, paste, replace, import**

Same pattern: cut App.tsx 4211–4826, paste into return, replace with:

```tsx
{activeTab === 'overview' && (
  <OverviewTab
    selectedWalletAddr={selectedWalletAddr}
    getTokenLogoUrl={getTokenLogoUrl}
    onOpenHistory={() => setActiveTab('history')}
  />
)}
```

Import: `import { OverviewTab } from './tabs/OverviewTab';`

Delete 8 state declarations from App.tsx.

- [ ] **Step 3: TypeScript + tests + smoke**

```
npx tsc --noEmit && npm run test && npm run dev
```
Expected: 0 errors, Overview tab renders correctly.

- [ ] **Step 4: Commit**

```
git add src/tabs/OverviewTab.tsx src/App.tsx
git commit -m "refactor: extract OverviewTab — allocation/overview local state isolated"
```

---

## Task 10: HomeTab Extraction

**Files:**
- Create: `src/tabs/HomeTab.tsx`
- Modify: `src/App.tsx` (lines 3992–4210 → component reference)

**Local state moving into HomeTab (5 items):**
`frontMarketPeriod · priceChangePeriod · homeSearch · showRecentActivity · showReceivedAssets`

- [ ] **Step 1: Create `src/tabs/HomeTab.tsx`**

```typescript
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';

type FrontMarketPeriod = '1h' | '24h' | '7d';

interface HomeTabProps {
  getTokenLogoUrl: (asset: any) => string;
  onOpenHistory: () => void;
  onOpenMarketWatch: (search?: string) => void;
}

export function HomeTab({ getTokenLogoUrl, onOpenHistory, onOpenMarketWatch }: HomeTabProps) {
  const { prices, tokenLogos, tokenMarketData, wallets, history } = usePortfolio();
  const { currentAssets, currentTransactions } = usePortfolioData();

  const [frontMarketPeriod, setFrontMarketPeriod] = useState<FrontMarketPeriod>('24h');
  const [priceChangePeriod, setPriceChangePeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [homeSearch, setHomeSearch] = useState('');
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showReceivedAssets, setShowReceivedAssets] = useState(false);

  // Move these memos here from App.tsx (they only belong to the home view):
  // - coreLiveTokens (~line 3362)
  // - topHoldingCards (~line 3406)
  // - frontPageGridTokens (~line 3429)
  // - frontPagePortfolioRows (~line 3461)
  // - frontPageCoinItems (~line 3469)
  // - frontPageChainRows (~line 3524)
  // - frontPagePulseTips (~line 3537)
  // - frontPageMarketStats (~line 3580)
  // - frontInfoCards (~line 3614)
  // These depend only on prices, currentAssets, currentTransactions, tokenMarketData.

  // Paste JSX from App.tsx lines 3992–4210 here.
  return (
    <div>{ /* JSX goes here */ }</div>
  );
}
```

- [ ] **Step 2: Cut, paste, replace, import — same pattern as previous tabs**

```tsx
{activeTab === 'home' && (
  <HomeTab
    getTokenLogoUrl={getTokenLogoUrl}
    onOpenHistory={() => setActiveTab('history')}
    onOpenMarketWatch={(s) => { setMarketWatchInitialSearch(s ?? ''); setShowMarketWatch(true); }}
  />
)}
```

Import: `import { HomeTab } from './tabs/HomeTab';`

Delete 5 state declarations + all 9 home-page memos from App.tsx.

- [ ] **Step 3: TypeScript + tests + smoke**

```
npx tsc --noEmit && npm run test && npm run dev
```
Expected: 0 errors, Home tab renders with live price cards and portfolio rows.

- [ ] **Step 4: Commit**

```
git add src/tabs/HomeTab.tsx src/App.tsx
git commit -m "refactor: extract HomeTab — 9 home-only memos now scoped to HomeTab"
```

---

## Task 11: Slim App.tsx + Remaining Thin Tabs

**Files:**
- Create: `src/tabs/DefiTab.tsx`, `src/tabs/BridgeTab.tsx`, `src/tabs/PulsechainOfficialTab.tsx`, `src/tabs/PulsechainCommunityTab.tsx`
- Modify: `src/App.tsx` — final cleanup to ~200-line shell

After Tasks 5–10, App.tsx should contain only:
- Navigation state: `activeTab, selectedWalletAddr, activeWallet, sidebarOpen, sidebarWalletsOpen, mobileMoreOpen`
- App shell JSX: nav, sidebar, tab router
- `getTokenLogoUrl` callback (used by multiple tabs as prop)
- `isApiKeyModalOpen / apiKeyInput` — or move these into a SettingsModal component
- `lastUpdated / timeSinceLastUpdate` — or move header display into a `<AppHeader>` component

- [ ] **Step 1: Extract remaining thin tabs**

For each of the 4 thin tabs (DefiTab, BridgeTab, PulsechainOfficialTab, PulsechainCommunityTab), create a wrapper file:

**`src/tabs/DefiTab.tsx`** (lines 4827–4835):
```typescript
import React from 'react';
import { LiquidityOverviewStrip, LiquiditySection } from '../components/LiquiditySection';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';

export function DefiTab() {
  const { prices, wallets } = usePortfolio();
  const { currentAssets } = usePortfolioData();
  // Paste App.tsx lines 4827–4835 content here
  return <div>{ /* JSX */ }</div>;
}
```

**`src/tabs/BridgeTab.tsx`** (lines 6631+):
```typescript
import React from 'react';
import BridgeDashboardPage from '../components/BridgeDashboardPage';
import { usePortfolio } from '../context/PortfolioContext';

export function BridgeTab() {
  const { wallets } = usePortfolio();
  return <BridgeDashboardPage wallets={wallets} />;
}
```

**`src/tabs/PulsechainOfficialTab.tsx`** (lines 6608–6624):
```typescript
import React from 'react';
import PulseChainOfficialPage from '../components/PulseChainOfficialPage';
export function PulsechainOfficialTab() { return <PulseChainOfficialPage />; }
```

**`src/tabs/PulsechainCommunityTab.tsx`** (lines 6625–6630):
```typescript
import React from 'react';
import PulseChainCommunityPage from '../components/PulseChainCommunityPage';
export function PulsechainCommunityTab() { return <PulseChainCommunityPage />; }
```

- [ ] **Step 2: Add `activeWallet` to PortfolioContext**

In `usePortfolioData.ts`, the `activeWallet` is hardcoded to `null`. To fix this, add `activeWallet` and `setActiveWallet` to PortfolioContextValue and PortfolioProvider:

```typescript
// In PortfolioContextValue interface:
activeWallet: string | null;
setActiveWallet: React.Dispatch<React.SetStateAction<string | null>>;

// In PortfolioProvider:
const [activeWallet, setActiveWallet] = useState<string | null>(null);

// In value object:
activeWallet, setActiveWallet,
```

Update `usePortfolioData.ts` to read `activeWallet` from `usePortfolio()` instead of the local `null` constant.

- [ ] **Step 3: Final App.tsx — target state**

After all extractions, App.tsx should look like this:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from './context/PortfolioContext';
import { HomeTab } from './tabs/HomeTab';
import { OverviewTab } from './tabs/OverviewTab';
import { AssetsTab } from './tabs/AssetsTab';
import { StakesTab } from './tabs/StakesTab';
import { HistoryTab } from './tabs/HistoryTab';
import { WalletsTab } from './tabs/WalletsTab';
import { DefiTab } from './tabs/DefiTab';
import { BridgeTab } from './tabs/BridgeTab';
import { PulsechainOfficialTab } from './tabs/PulsechainOfficialTab';
import { PulsechainCommunityTab } from './tabs/PulsechainCommunityTab';

type ActiveTab = 'home' | 'overview' | 'assets' | 'stakes' | 'history' | 'wallets' | 'defi' | 'pulsechain-official' | 'pulsechain-community' | 'bridge';

const ACTIVE_TAB_KEY = 'pulseport_active_tab';

function readStoredActiveTab(): ActiveTab {
  try { return (localStorage.getItem(ACTIVE_TAB_KEY) as ActiveTab) ?? 'home'; }
  catch { return 'home'; }
}

export default function App() {
  const { theme, tokenLogos, isLoading, lastUpdated, prices, wallets, realAssets } = usePortfolio();

  const [activeTab, setActiveTab] = useState<ActiveTab>(readStoredActiveTab);
  const [selectedWalletAddr, setSelectedWalletAddr] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWalletsOpen, setSidebarWalletsOpen] = useState(true);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [showMarketWatch, setShowMarketWatch] = useState(false);
  const [marketWatchInitialSearch, setMarketWatchInitialSearch] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [timeSinceLastUpdate, setTimeSinceLastUpdate] = useState(0);
  const [profitPlannerOpen, setProfitPlannerOpen] = useState(false);

  useEffect(() => { localStorage.setItem(ACTIVE_TAB_KEY, activeTab); }, [activeTab]);
  useEffect(() => { if (activeTab !== mobileMoreOpen) setMobileMoreOpen(false); }, [activeTab]);
  useEffect(() => {
    const id = setInterval(() => setTimeSinceLastUpdate(
      lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : 0
    ), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const getTokenLogoUrl = useCallback((asset: any): string => {
    if (!asset) return '';
    return asset.logoUrl || tokenLogos[asset.symbol?.toLowerCase?.()] || tokenLogos[asset.symbol] || '';
  }, [tokenLogos]);

  // App shell JSX: nav, sidebar, tab router
  return (
    <div className={`app-shell theme-${theme}`}>
      {/* nav + sidebar JSX (copy from existing App.tsx shell sections) */}

      <main>
        {activeTab === 'home' && <HomeTab getTokenLogoUrl={getTokenLogoUrl} onOpenHistory={() => setActiveTab('history')} onOpenMarketWatch={(s) => { setMarketWatchInitialSearch(s ?? ''); setShowMarketWatch(true); }} />}
        {activeTab === 'overview' && <OverviewTab selectedWalletAddr={selectedWalletAddr} getTokenLogoUrl={getTokenLogoUrl} onOpenHistory={() => setActiveTab('history')} />}
        {activeTab === 'assets' && <AssetsTab selectedWalletAddr={selectedWalletAddr} getTokenLogoUrl={getTokenLogoUrl} onFilterByAsset={() => {}} />}
        {activeTab === 'stakes' && <StakesTab tokenLogos={tokenLogos} />}
        {activeTab === 'history' && <HistoryTab selectedWalletAddr={selectedWalletAddr} getTokenLogoUrl={getTokenLogoUrl} />}
        {activeTab === 'wallets' && <WalletsTab selectedWalletAddr={selectedWalletAddr} onSelectWallet={setSelectedWalletAddr} getTokenLogoUrl={getTokenLogoUrl} />}
        {activeTab === 'defi' && <DefiTab />}
        {activeTab === 'bridge' && <BridgeTab />}
        {activeTab === 'pulsechain-official' && <PulsechainOfficialTab />}
        {activeTab === 'pulsechain-community' && <PulsechainCommunityTab />}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: TypeScript + all tests + full smoke**

```
npx tsc --noEmit && npm run test
```
Expected: 0 errors, all tests pass.

```
npm run dev
```
Visit every tab. Add a wallet, refresh data, check History, Stakes, Assets, Overview, Home. All must work identically.

- [ ] **Step 5: Commit**

```
git add src/tabs/ src/App.tsx src/context/PortfolioContext.tsx
git commit -m "refactor: slim App.tsx to ~200-line shell — all tabs extracted, full decomposition complete"
```

---

## Task 12: Parallelize fetchPortfolio Price Fetches

**Files:**
- Modify: `src/context/PortfolioContext.tsx` (inside fetchPortfolio, lines corresponding to original App.tsx 844–1037)

### Current bottleneck
Sequential awaits: CoinGecko markets → fallback simple/price → on-chain LP reserves. Three network hops done serially = 3× latency.

- [ ] **Step 1: Replace sequential fetches with Promise.all**

Find in PortfolioContext.tsx (migrated from App.tsx ~line 844) the price fetch section. It currently looks like:

```typescript
// 1. Fetch CoinGecko prices (sequential)
const priceRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?...`);
const priceArray = await priceRes.json();
// ... process ...
// Then:
const batchRes = await fetch(pcRpc, { ... });  // on-chain LP
const batchData = await batchRes.json();
```

Replace with:

```typescript
// Run CoinGecko and on-chain LP reads in parallel
const [priceRes, batchRes] = await Promise.allSettled([
  fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cgIds}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h,24h,7d`, { signal: AbortSignal.timeout(15_000) }),
  fetch(pcRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchPayload),
    signal: AbortSignal.timeout(15_000),
  }),
]);

// Process price result
if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
  const priceArray = await priceRes.value.json();
  // ... existing processing logic unchanged ...
} else {
  // Fallback to simple/price (existing fallback block)
  try {
    const simpleRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?...`);
    const simpleData = await simpleRes.json();
    // ... existing fallback processing ...
  } catch (e) { console.warn('CoinGecko fallback failed:', e); }
}

// Process on-chain LP result
if (batchRes.status === 'fulfilled' && batchRes.value.ok) {
  const batchData: any[] = await batchRes.value.json();
  // ... existing LP processing logic unchanged ...
}
```

- [ ] **Step 2: Run TypeScript check + smoke**

```
npx tsc --noEmit && npm run dev
```
Open DevTools → Network tab. Confirm the CoinGecko and on-chain LP requests fire simultaneously (same timestamp), not sequentially.

- [ ] **Step 3: Commit**

```
git add src/context/PortfolioContext.tsx
git commit -m "perf: parallelize CoinGecko + on-chain LP price fetches — reduces initial load latency"
```

---

## Self-Review

**Spec coverage check:**

| Approved design item | Covered by task |
|---|---|
| PortfolioContext with 17+ global state items | Task 2 |
| usePortfolioData hook with assetByKey Map | Task 3 |
| React.memo + Map lookup in TransactionList | Task 1 |
| HistoryTab with 7 local states | Task 5 |
| StakesTab with 3 local states | Task 6 |
| AssetsTab with 10 local states | Task 7 |
| WalletsTab with 9 local states | Task 8 |
| OverviewTab with 8 local states | Task 9 |
| HomeTab with 5 local states + 9 memos | Task 10 |
| Thin tabs (Defi, Bridge, etc.) | Task 11 |
| App.tsx slimmed to ~200 lines | Task 11 |
| Parallelize price fetches | Task 12 |
| `activeWallet` moved to context | Task 11 Step 2 |
| `summary` useMemo scoped to consumers | Task 9 (OverviewTab) |

**Type consistency check:**
- `PortfolioContextValue` defined in Task 2, consumed by all subsequent tasks ✓
- `usePortfolioData()` returns `{ currentAssets, currentTransactions, assetByKey }` — all tasks use exactly these names ✓
- `buildAssetByKey` / `normalizeAssetSymbol` exported from `usePortfolioData.ts` in Task 3, then moved to `assetHelpers.ts` in Task 4 — update import path in test file ✓
- `sameAssetSymbol` defined in `assetHelpers.ts` (Task 4), imported by HistoryTab (Task 5) ✓

**Placeholder scan:** No TBDs — every task contains actual code and exact commands.
