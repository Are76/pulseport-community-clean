import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Asset, Wallet, HexStake, LpPosition, FarmPosition, HistoryPoint, Transaction } from '../types';
import { scheduleLocalStorageWrite } from '../utils/localStorageDebounce';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Context interface ──────────────────────────────────────────────────────────

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

  // ── Section collapse helpers ─────────────────────────────────────────────────

  const isCollapsed = useCallback((key: string) => !!collapsedSections[key], [collapsedSections]);
  const toggleCollapsed = useCallback((key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── fetchPortfolio placeholder (replaced in Task 4) ──────────────────────────

  const fetchPortfolio = useCallback(async () => {
    if (isFetchingRef.current) return;
    console.warn('fetchPortfolio not yet migrated from App.tsx');
  }, [wallets]); // eslint-disable-line react-hooks/exhaustive-deps

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
