# App.tsx Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce App.tsx from 2,311 lines to <1,000 lines by extracting helpers, constants, and state management into dedicated modules, fixing circular dependencies, and focusing App.tsx on routing + layout + context orchestration.

**Architecture:** Extract state management to PortfolioContext, AppUIContext (new), and AppModalsContext (new). Move all helper functions to utils/appHelpers.ts and constants to constants.ts. This eliminates the PortfolioContext → App.tsx circular import and creates clear separation of concerns: contexts handle state, utils handle pure functions, App.tsx orchestrates routing and layout.

**Tech Stack:** React, TypeScript, Viem, date-fns, Recharts, motion

---

## Task 1: Extract Helper Functions and Constants

**Files:**
- Create: `src/utils/appHelpers.ts`
- Create: `src/utils/appConstants.ts`
- Modify: `src/App.tsx` (remove extracted code)
- Modify: `src/context/PortfolioContext.tsx` (remove imports from App.tsx)

### Overview

The App.tsx file contains ~30 helper functions and constants that should be in standalone utility files. This blocks the PortfolioContext from importing what it needs without creating circular dependencies. Extract all of these to dedicated files.

### Step 1.1: Create appHelpers.ts with utility functions

Create file: `src/utils/appHelpers.ts`

```typescript
// Pure helper functions extracted from App.tsx

export const shortenAddr = (addr: string): string => {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

export const normalizeAssetSymbol = (symbol: string, chain?: string): string => {
  const s = symbol.toUpperCase();
  if (chain === 'ethereum' && s === 'HEX') return 'eHEX';
  if (chain === 'base' && s === 'USDC') return 'USDbC';
  return s;
};

export const sameAssetSymbol = (left: string, right: string, chain?: string): boolean => {
  return normalizeAssetSymbol(left, chain) === normalizeAssetSymbol(right, chain);
};

export function tryReadCache<T>(key: string, withBigInt = false): T | null {
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

export function readStoredJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const bigIntReviver = (_key: string, value: unknown) =>
  typeof value === 'string' && /^\d{15,}$/.test(value) ? BigInt(value) : value;

export const bigIntReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value;

export const isNoContractDataError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes('code CALL_EXCEPTION') && error.message.includes('Contract does not have code');

export const decodeLibertySwapInput = (input: string): { dstChainId: number; orderId: string } | null => {
  try {
    if (!input.startsWith('0x')) return null;
    if (input.length < 138) return null;
    const selector = input.slice(2, 10);
    if (selector !== 'dc655e26') return null;
    const dstChainIdHex = input.slice(10, 74);
    const orderIdHex = input.slice(74, 138);
    return {
      dstChainId: parseInt(dstChainIdHex, 16),
      orderId: '0x' + orderIdHex,
    };
  } catch {
    return null;
  }
};
```

### Step 1.2: Run tests to verify no regressions

Run: `npm test`
Expected: All 151 tests passing

### Step 1.3: Create appConstants.ts with all constants and data

Create file: `src/utils/appConstants.ts`

```typescript
import type { Chain } from '../types';

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
] as const;

export const WALLET_DOT_COLORS = [
  '#00FF9F', '#f739ff', '#627EEA', '#f97316', '#a855f7',
  '#f59e0b', '#06b6d4', '#ec4899'
];

export const CHAIN_COLORS: Record<Chain, string> = {
  pulsechain: '#00FF9F',
  ethereum: '#627EEA',
  base: '#0052FF',
};

export const CHAIN_LABELS: Record<string, string> = {
  pulsechain: 'PulseChain',
  ethereum: 'Ethereum',
  base: 'Base',
  '369': 'PulseChain',
  '1': 'Ethereum',
  '8453': 'Base',
};

export const STATIC_LOGOS: Record<string, string> = {
  'pulsechain:0xa1077a294dde1b09bb078844df40758a5d0f9a27': 'https://dd.dexscreener.com/ds-data/chains/pulsechain.png',
  'pulsechain:0x95b303987a60c71504d99aa1b13b4da07b0790ab': 'https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x95b303987a60c71504d99aa1b13b4da07b0790ab.png',
  'ethereum:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x2b591e99afe9f32eaa6214f7b7629768c40eeb39.png',
  // ... (include all STATIC_LOGOS from App.tsx)
};

export const LIBERTY_SWAP_ROUTERS: Record<string, string> = {
  pulsechain: '0xa10d5d8dce3b0e5eb48dde571e2b8765776e448e',
  ethereum: '0x5800249621da520adAdab77742B5c4b087E3D08d4',
  base: '0xb8dd2f97e78f02d11f4f0b11fdf1c79e1a8f08b1',
};

export const LIBERTY_SWAP_SELECTOR = 'dc655e26';
export const MIN_INVESTMENT_THRESHOLD = 100;

export const CORE_TOKENS = [
  { chainId: 'pulsechain', address: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', symbol: 'PLS',  name: 'PulseChain' },
  { chainId: 'pulsechain', address: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', symbol: 'PLSX', name: 'PulseX' },
  { chainId: 'pulsechain', address: '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d', symbol: 'INC',  name: 'Incentive' },
  { chainId: 'pulsechain', address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', symbol: 'HEX',  name: 'HEX' },
  { chainId: 'pulsechain', address: '0xf6f8db0aba00007681f8faf16a0fda1c9b030b11', symbol: 'PRVX', name: 'PrivacyX' },
  { chainId: 'pulsechain', address: '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c', symbol: 'WETH', name: 'Wrapped Ether from Ethereum' },
  { chainId: 'pulsechain', address: '0xb17d901469b9208b17d916112988a3fed19b5ca1', symbol: 'WBTC', name: 'Wrapped BTC from Ethereum' },
  { chainId: 'ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether' },
  { chainId: 'ethereum', address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', symbol: 'eHEX', name: 'HEX on Ethereum' },
  { chainId: 'ethereum', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin' },
  { chainId: 'ethereum', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD' },
  { chainId: 'base', address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether on Base' },
  { chainId: 'base', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913'.toLowerCase(), symbol: 'USDC', name: 'USD Coin on Base' },
];

export const ACTIVE_TABS = ['home', 'overview', 'assets', 'stakes', 'history', 'tracker', 'defi', 'pulsechain-official', 'pulsechain-community', 'bridge', 'wallet-analyzer'] as const;
export const ACTIVE_TAB_STORAGE_KEY = 'pulseport_active_tab';
```

### Step 1.4: Update PortfolioContext.tsx to import from utils instead of App.tsx

Remove the circular import on line 7:
```typescript
// OLD: import { bigIntReplacer, ETH_HEX_ADDR, EHEX_PULSECHAIN_ADDR, ERC20_ABI, STATIC_LOGOS, LIBERTY_SWAP_ROUTERS, decodeLibertySwapInput, isNoContractDataError } from '../App';

// NEW: import from utils
import { bigIntReplacer, ERC20_ABI, STATIC_LOGOS, LIBERTY_SWAP_ROUTERS, decodeLibertySwapInput, isNoContractDataError } from './appHelpers';
import { ERC20_ABI, STATIC_LOGOS } from './appConstants';
```

Also add:
```typescript
import { ETH_HEX_ADDR, EHEX_PULSECHAIN_ADDR } from '../constants';
```

(These constants should already be in constants.ts or need to be verified to exist there)

### Step 1.5: Update App.tsx imports

Remove all the helper function definitions from App.tsx and add imports:

```typescript
import { shortenAddr, normalizeAssetSymbol, sameAssetSymbol, tryReadCache, readStoredJSON, bigIntReviver, bigIntReplacer, isNoContractDataError, decodeLibertySwapInput } from './utils/appHelpers';
import { ERC20_ABI, WALLET_DOT_COLORS, CHAIN_COLORS, CHAIN_LABELS, STATIC_LOGOS, LIBERTY_SWAP_ROUTERS, LIBERTY_SWAP_SELECTOR, MIN_INVESTMENT_THRESHOLD, CORE_TOKENS, ACTIVE_TABS, ACTIVE_TAB_STORAGE_KEY } from './utils/appConstants';
```

### Step 1.6: Run full test suite

Run: `npm test`
Expected: All 151 tests passing, no TypeScript errors

### Step 1.7: Commit extraction

```bash
git add src/utils/appHelpers.ts src/utils/appConstants.ts src/App.tsx src/context/PortfolioContext.tsx
git commit -m "refactor: extract helpers and constants from App.tsx

- Create src/utils/appHelpers.ts with pure helper functions
- Create src/utils/appConstants.ts with constants and data structures
- Remove circular dependency: PortfolioContext no longer imports from App.tsx
- Update App.tsx to import from new utility files
- All tests passing (151/151)"
```

---

## Task 2: Create AppUIContext for UI State Management

**Files:**
- Create: `src/context/AppUIContext.tsx`
- Modify: `src/App.tsx` (migrate state to context)

### Overview

App.tsx currently manages UI state (activeTab, sidebarOpen, mobileMoreOpen, etc.) directly. Extract this into a dedicated context to reduce App.tsx size and make UI state reusable across components.

### Step 2.1: Create AppUIContext

Create file: `src/context/AppUIContext.tsx`

```typescript
import React, { createContext, useContext, useState } from 'react';

export type ActiveTab = 'home' | 'overview' | 'assets' | 'stakes' | 'history' | 'tracker' | 'wallets' | 'defi' | 'pulsechain-official' | 'pulsechain-community' | 'bridge' | 'wallet-analyzer';

export interface AppUIContextValue {
  // Tab management
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarWalletsOpen: boolean;
  setSidebarWalletsOpen: (open: boolean) => void;
  
  // Mobile menu
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  
  // UI preferences
  priceDisplayCurrency: 'usd' | 'pls';
  setPriceDisplayCurrency: (currency: 'usd' | 'pls') => void;
  
  // Content visibility
  showReceivedAssets: boolean;
  setShowReceivedAssets: (show: boolean) => void;
  showRecentActivity: boolean;
  setShowRecentActivity: (show: boolean) => void;
  
  // Filter state
  receivedCoinFilter: string;
  setReceivedCoinFilter: (filter: string) => void;
  receivedChainFilter: string;
  setReceivedChainFilter: (filter: string) => void;
  selectedWalletAddr: string;
  setSelectedWalletAddr: (addr: string) => void;
  
  // Yield display preference
  yieldUnit: 'hex' | 'usd';
  setYieldUnit: (unit: 'hex' | 'usd') => void;
}

const AppUIContext = createContext<AppUIContextValue | undefined>(undefined);

export const AppUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const stored = localStorage.getItem('pulseport_active_tab');
    return (stored || 'home') as ActiveTab;
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWalletsOpen, setSidebarWalletsOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  
  const [priceDisplayCurrency, setPriceDisplayCurrency] = useState<'usd' | 'pls'>('usd');
  
  const [showReceivedAssets, setShowReceivedAssets] = useState(true);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  
  const [receivedCoinFilter, setReceivedCoinFilter] = useState<string>('all');
  const [receivedChainFilter, setReceivedChainFilter] = useState<string>('all');
  const [selectedWalletAddr, setSelectedWalletAddr] = useState<string>('all');
  
  const [yieldUnit, setYieldUnit] = useState<'hex' | 'usd'>(() => {
    const stored = localStorage.getItem('pulseport_yield_unit');
    return (stored as 'hex' | 'usd') || 'hex';
  });

  const value: AppUIContextValue = {
    activeTab,
    setActiveTab: (tab) => {
      setActiveTab(tab);
      localStorage.setItem('pulseport_active_tab', tab);
    },
    sidebarOpen,
    setSidebarOpen,
    sidebarWalletsOpen,
    setSidebarWalletsOpen,
    mobileMoreOpen,
    setMobileMoreOpen,
    priceDisplayCurrency,
    setPriceDisplayCurrency,
    showReceivedAssets,
    setShowReceivedAssets,
    showRecentActivity,
    setShowRecentActivity,
    receivedCoinFilter,
    setReceivedCoinFilter,
    receivedChainFilter,
    setReceivedChainFilter,
    selectedWalletAddr,
    setSelectedWalletAddr,
    yieldUnit,
    setYieldUnit: (unit) => {
      setYieldUnit(unit);
      localStorage.setItem('pulseport_yield_unit', unit);
    },
  };

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
};

export const useAppUI = (): AppUIContextValue => {
  const context = useContext(AppUIContext);
  if (!context) throw new Error('useAppUI must be used within AppUIProvider');
  return context;
};
```

### Step 2.2: Update App.tsx to use AppUIContext

In App.tsx main function, replace the 15 state declarations related to UI with:

```typescript
const { 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  sidebarWalletsOpen,
  setSidebarWalletsOpen,
  mobileMoreOpen,
  setMobileMoreOpen,
  priceDisplayCurrency,
  setPriceDisplayCurrency,
  showReceivedAssets,
  setShowReceivedAssets,
  showRecentActivity,
  setShowRecentActivity,
  receivedCoinFilter,
  setReceivedCoinFilter,
  receivedChainFilter,
  setReceivedChainFilter,
  selectedWalletAddr,
  setSelectedWalletAddr,
  yieldUnit,
  setYieldUnit
} = useAppUI();
```

And remove the old useState calls for these values.

### Step 2.3: Wrap App with AppUIProvider

In main.tsx or the component that renders App.tsx, wrap it:

```typescript
<AppUIProvider>
  <App />
</AppUIProvider>
```

### Step 2.4: Run tests

Run: `npm test`
Expected: All 151 tests passing

### Step 2.5: Commit

```bash
git add src/context/AppUIContext.tsx src/App.tsx src/main.tsx
git commit -m "refactor: extract UI state to AppUIContext

- Create AppUIContext to manage tab, sidebar, and filter state
- Move 15 UI-related useState hooks from App.tsx to context
- Persist activeTab and yieldUnit to localStorage
- Wrap App with AppUIProvider in main.tsx
- All tests passing (151/151)"
```

---

## Task 3: Create AppModalsContext for Modal State

**Files:**
- Create: `src/context/AppModalsContext.tsx`
- Modify: `src/App.tsx` (migrate modal state to context)

### Overview

App.tsx manages state for 10+ modals (wallet form, custom coins, API key, market watch, etc.). Extract this into a dedicated context to simplify modal management and reduce App.tsx complexity.

### Step 3.1: Create AppModalsContext

Create file: `src/context/AppModalsContext.tsx`

```typescript
import React, { createContext, useContext, useState } from 'react';
import type { Asset } from '../types';

export interface AppModalsContextValue {
  // Wallet management modals
  isAddingWallet: boolean;
  setIsAddingWallet: (open: boolean) => void;
  newWalletAddress: string;
  setNewWalletAddress: (addr: string) => void;
  newWalletName: string;
  setNewWalletName: (name: string) => void;
  walletFormError: string;
  setWalletFormError: (error: string) => void;
  
  editingWalletAddress: string | null;
  setEditingWalletAddress: (addr: string | null) => void;
  editWalletName: string;
  setEditWalletName: (name: string) => void;
  
  // Custom coins modal
  isCustomCoinsModalOpen: boolean;
  setIsCustomCoinsModalOpen: (open: boolean) => void;
  customCoinDraft: { symbol: string; name: string; balance: string; price: string };
  setCustomCoinDraft: (draft: { symbol: string; name: string; balance: string; price: string }) => void;
  
  // API key modal
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
  apiKeyInput: string;
  setApiKeyInput: (key: string) => void;
  
  // Market watch
  showMarketWatch: boolean;
  setShowMarketWatch: (show: boolean) => void;
  marketWatchInitialSearch: string;
  setMarketWatchInitialSearch: (search: string) => void;
  
  // Token card modal
  tokenCardModal: Asset | null;
  setTokenCardModal: (asset: Asset | null) => void;
  tokenCardModalLoading: boolean;
  setTokenCardModalLoading: (loading: boolean) => void;
  
  // Profit planner
  profitPlannerOpen: boolean;
  setProfitPlannerOpen: (open: boolean) => void;
  
  // PnL asset selection
  pnlAsset: Asset | null;
  setPnlAsset: (asset: Asset | null) => void;
  
  // Bridge transaction
  selectedBridgeTxId: string | null;
  setSelectedBridgeTxId: (id: string | null) => void;
}

const AppModalsContext = createContext<AppModalsContextValue | undefined>(undefined);

export const AppModalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [walletFormError, setWalletFormError] = useState('');
  
  const [editingWalletAddress, setEditingWalletAddress] = useState<string | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  
  const [isCustomCoinsModalOpen, setIsCustomCoinsModalOpen] = useState(false);
  const [customCoinDraft, setCustomCoinDraft] = useState({ symbol: '', name: '', balance: '', price: '' });
  
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const [showMarketWatch, setShowMarketWatch] = useState(false);
  const [marketWatchInitialSearch, setMarketWatchInitialSearch] = useState('');
  
  const [tokenCardModal, setTokenCardModal] = useState<Asset | null>(null);
  const [tokenCardModalLoading, setTokenCardModalLoading] = useState(false);
  
  const [profitPlannerOpen, setProfitPlannerOpen] = useState(false);
  
  const [pnlAsset, setPnlAsset] = useState<Asset | null>(null);
  
  const [selectedBridgeTxId, setSelectedBridgeTxId] = useState<string | null>(null);

  const value: AppModalsContextValue = {
    isAddingWallet, setIsAddingWallet,
    newWalletAddress, setNewWalletAddress,
    newWalletName, setNewWalletName,
    walletFormError, setWalletFormError,
    editingWalletAddress, setEditingWalletAddress,
    editWalletName, setEditWalletName,
    isCustomCoinsModalOpen, setIsCustomCoinsModalOpen,
    customCoinDraft, setCustomCoinDraft,
    isApiKeyModalOpen, setIsApiKeyModalOpen,
    apiKeyInput, setApiKeyInput,
    showMarketWatch, setShowMarketWatch,
    marketWatchInitialSearch, setMarketWatchInitialSearch,
    tokenCardModal, setTokenCardModal,
    tokenCardModalLoading, setTokenCardModalLoading,
    profitPlannerOpen, setProfitPlannerOpen,
    pnlAsset, setPnlAsset,
    selectedBridgeTxId, setSelectedBridgeTxId,
  };

  return <AppModalsContext.Provider value={value}>{children}</AppModalsContext.Provider>;
};

export const useAppModals = (): AppModalsContextValue => {
  const context = useContext(AppModalsContext);
  if (!context) throw new Error('useAppModals must be used within AppModalsProvider');
  return context;
};
```

### Step 3.2: Update App.tsx to use AppModalsContext

Remove 18 modal-related useState declarations and replace with:

```typescript
const {
  isAddingWallet, setIsAddingWallet,
  newWalletAddress, setNewWalletAddress,
  newWalletName, setNewWalletName,
  walletFormError, setWalletFormError,
  editingWalletAddress, setEditingWalletAddress,
  editWalletName, setEditWalletName,
  isCustomCoinsModalOpen, setIsCustomCoinsModalOpen,
  customCoinDraft, setCustomCoinDraft,
  isApiKeyModalOpen, setIsApiKeyModalOpen,
  apiKeyInput, setApiKeyInput,
  showMarketWatch, setShowMarketWatch,
  marketWatchInitialSearch, setMarketWatchInitialSearch,
  tokenCardModal, setTokenCardModal,
  tokenCardModalLoading, setTokenCardModalLoading,
  profitPlannerOpen, setProfitPlannerOpen,
  pnlAsset, setPnlAsset,
  selectedBridgeTxId, setSelectedBridgeTxId,
} = useAppModals();
```

### Step 3.3: Wrap App with AppModalsProvider

In main.tsx, update to:

```typescript
<AppUIProvider>
  <AppModalsProvider>
    <App />
  </AppModalsProvider>
</AppUIProvider>
```

### Step 3.4: Run tests

Run: `npm test`
Expected: All 151 tests passing

### Step 3.5: Commit

```bash
git add src/context/AppModalsContext.tsx src/App.tsx src/main.tsx
git commit -m "refactor: extract modal state to AppModalsContext

- Create AppModalsContext to manage all modal-related state
- Move 18 modal useState hooks from App.tsx to context
- Wrap App with AppModalsProvider in main.tsx
- All tests passing (151/151)"
```

---

## Task 4: Extract Inline Components from App.tsx

**Files:**
- Create: `src/components/PriceDisplay.tsx`
- Create: `src/components/StakingLadder.tsx`
- Create: `src/components/StakingPie.tsx`
- Create: `src/components/WalletSelector.tsx`
- Modify: `src/App.tsx` (remove component definitions, add imports)

### Overview

Four components (PriceDisplay, StakingLadder, StakingPie, WalletSelector) are defined inside App.tsx. Extract each to its own file for clarity and reusability.

### Step 4.1: Extract PriceDisplay component

Create file: `src/components/PriceDisplay.tsx`

```typescript
import React from 'react';

interface PriceDisplayProps {
  price: number;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, className }) => {
  if (price === 0) return <span className={className}>$0.00</span>;

  if (price < 0.0001 && price > 0) {
    const priceStr = price.toFixed(12);
    const parts = priceStr.split('.');
    if (parts[1]) {
      const zeros = parts[1].match(/^0+/)?.[0].length || 0;
      const significant = parts[1].slice(zeros, zeros + 2);
      return <span className={className}>$0.0<sub>{zeros}</sub>{significant}</span>;
    }
  }

  if (price < 1) return <span className={className}>${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>;
  if (price < 1000) return <span className={className}>${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>;
  return <span className={className}>${(price / 1000).toFixed(1)}K</span>;
};
```

### Step 4.2: Extract StakingLadder component

Create file: `src/components/StakingLadder.tsx`

```typescript
import React from 'react';
import type { HexStake } from '../types';

interface StakingLadderProps {
  stakes: HexStake[];
}

export const StakingLadder: React.FC<StakingLadderProps> = ({ stakes }) => {
  if (stakes.length === 0) return <div style={{ color: 'var(--fg-subtle)', textAlign: 'center', padding: 20 }}>No stakes</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {stakes
        .sort((a, b) => Number(b.stakedHearts) - Number(a.stakedHearts))
        .slice(0, 6)
        .map((stake, i) => {
          const max = Math.max(...stakes.map(s => Number(s.stakedHearts)));
          const height = Math.max(10, (Number(stake.stakedHearts) / max) * 100);
          const isAutoStake = stake.isAutoStake;
          return (
            <div
              key={stake.id}
              style={{
                flex: 1,
                height: `${height}%`,
                backgroundColor: isAutoStake ? 'var(--accent)' : 'var(--fg-muted)',
                borderRadius: 4,
                opacity: isAutoStake ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={`Stake ${i + 1}: ${(Number(stake.stakedHearts) / 1e12).toFixed(0)} HEX`}
            />
          );
        })}
    </div>
  );
};
```

### Step 4.3: Extract StakingPie component

Create file: `src/components/StakingPie.tsx`

```typescript
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { HexStake } from '../types';

interface StakingPieProps {
  stakes: HexStake[];
  hexUsdPrice: number;
}

export const StakingPie: React.FC<StakingPieProps> = ({ stakes, hexUsdPrice }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (stakes.length === 0) return <div style={{ color: 'var(--fg-subtle)', textAlign: 'center', padding: 20 }}>No stakes</div>;

  const data = stakes.map(stake => ({
    name: stake.walletLabel || `Stake ${stake.stakeId}`,
    value: Number(stake.estimatedValueUsd),
  }));

  const COLORS = ['#00FF9F', '#f739ff', '#627EEA', '#f97316', '#a855f7', '#f59e0b'];

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: $${(value / 1e6).toFixed(1)}M`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            activeIndex={activeIndex}
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Step 4.4: Extract WalletSelector component

Create file: `src/components/WalletSelector.tsx`

```typescript
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Wallet } from '../types';

interface WalletSelectorProps {
  wallets: Wallet[];
  activeWallet: string | null;
  onSelect: (address: string) => void;
  onAdd: () => void;
  onRemove: (address: string) => void;
  walletLabels?: Record<string, string>;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  wallets,
  activeWallet,
  onSelect,
  onAdd,
  onRemove,
  walletLabels = {},
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {wallets.map(wallet => (
        <div
          key={wallet.address}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: activeWallet === wallet.address ? 'var(--bg-highlight)' : 'var(--bg-card)',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => onSelect(wallet.address)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{walletLabels[wallet.address] || wallet.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(wallet.address);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-subtle)',
              padding: 4,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--accent)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Plus size={14} /> Add wallet
      </button>
    </div>
  );
};
```

### Step 4.5: Update App.tsx imports

Remove all four component definitions and add:

```typescript
import { PriceDisplay } from './components/PriceDisplay';
import { StakingLadder } from './components/StakingLadder';
import { StakingPie } from './components/StakingPie';
import { WalletSelector } from './components/WalletSelector';
```

### Step 4.6: Run tests

Run: `npm test`
Expected: All 151 tests passing

### Step 4.7: Commit

```bash
git add src/components/PriceDisplay.tsx src/components/StakingLadder.tsx src/components/StakingPie.tsx src/components/WalletSelector.tsx src/App.tsx
git commit -m "refactor: extract inline components from App.tsx

- Create PriceDisplay.tsx for price formatting component
- Create StakingLadder.tsx for stake visualization
- Create StakingPie.tsx for stake distribution pie chart
- Create WalletSelector.tsx for wallet management UI
- Remove component definitions from App.tsx, add imports
- All tests passing (151/151)"
```

---

## Task 5: Clean Up App.tsx and Verify Size Reduction

**Files:**
- Modify: `src/App.tsx` (final cleanup and verification)

### Overview

After extracting state, helpers, and components, verify that App.tsx now focuses on routing, layout, and context orchestration. Check that it's below 1,000 lines.

### Step 5.1: Check current App.tsx line count

Run: `wc -l src/App.tsx`
Expected: < 1,100 lines (down from 2,311)

### Step 5.2: Verify no unused imports in App.tsx

Review App.tsx imports and remove any that are no longer used (e.g., helper functions that are now in appHelpers.ts).

### Step 5.3: Run full test suite

Run: `npm test`
Expected: All 151 tests passing, no errors

### Step 5.4: Verify TypeScript compilation

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

### Step 5.5: Final commit if cleanup needed

If any imports or minor cleanup was needed:

```bash
git add src/App.tsx
git commit -m "chore: cleanup App.tsx imports after refactoring

- Remove unused imports
- Verify App.tsx now focuses on routing and layout
- All tests passing (151/151)"
```

---

## Summary

After completing all 5 tasks:

✅ **App.tsx reduced from 2,311 to ~900 lines** (focusing on routing + layout + context)
✅ **Circular dependency fixed** (PortfolioContext no longer imports from App.tsx)
✅ **State management separated** into PortfolioContext, AppUIContext, AppModalsContext
✅ **Helper functions extracted** to appHelpers.ts and appConstants.ts
✅ **Inline components extracted** to individual files
✅ **All tests passing** (151/151)
✅ **Clean separation of concerns** established for future feature development

The refactored architecture:
- **App.tsx**: Router + Layout + Context setup
- **PortfolioContext**: Portfolio data (wallets, assets, stakes, transactions)
- **AppUIContext**: UI state (tabs, sidebar, filters, preferences)
- **AppModalsContext**: Modal/dialog state
- **utils/appHelpers.ts**: Pure functions for data manipulation
- **utils/appConstants.ts**: Constants, ABIs, and static data
- **components/**: Individual components (PriceDisplay, StakingLadder, etc.)
- **tabs/**: Tab pane components (HomeTab, OverviewTab, etc.)
- **pages/**: Page-level components (MyInvestmentsPage, WalletAnalyzer, etc.)
