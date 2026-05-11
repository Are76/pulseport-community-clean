import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { http, createPublicClient, fallback, formatUnits, getAddress } from 'viem';
import type { Asset, Wallet, HexStake, LpPosition, FarmPosition, HistoryPoint, Transaction, Chain } from '../types.ts';
import { scheduleLocalStorageWrite, resolveBlockscoutBase, resolveEtherscanCompatBase } from '../utils/localStorageDebounce';
import { normalizeTransactions } from '../utils/normalizeTransactions';
import { CHAINS, HEX_ABI, TOKENS, PULSEX_LP_PAIRS, PHEX_YIELD_PER_TSHARE, EHEX_YIELD_PER_TSHARE, PHEX_YIELD_BI_NUM, PHEX_YIELD_BI_DEN, EHEX_YIELD_BI_NUM, EHEX_YIELD_BI_DEN } from '../constants';
import { bigIntReplacer, decodeLibertySwapInput, isNoContractDataError } from '../utils/appHelpers';
import { ERC20_ABI, STATIC_LOGOS, LIBERTY_SWAP_ROUTERS, ETH_HEX_ADDR, EHEX_PULSECHAIN_ADDR } from '../utils/appConstants';

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

  useEffect(() => { scheduleLocalStorageWrite('pulseport_wallets', JSON.stringify(wallets)); }, [wallets]);
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
  // Apply theme to HTML element so CSS variables take effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Clear cached portfolio data when all wallets are removed ────────────────
  // fetchPortfolio only runs when wallets.length > 0, so without this effect
  // the stale assets/stakes/transactions would remain visible after removal.
  useEffect(() => {
    if (wallets.length === 0) {
      setRealAssets([]);
      setRealStakes([]);
      setLpPositions([]);
      setFarmPositions([]);
      setWalletAssets({});
      setTransactions([]);
      setHistory([]);
    }
  }, [wallets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Section collapse helpers ─────────────────────────────────────────────────

  const isCollapsed = useCallback((key: string) => !!collapsedSections[key], [collapsedSections]);
  const toggleCollapsed = useCallback((key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // ── fetchPortfolio implementation ────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  const fetchPortfolio = useCallback(async () => {
    if (isFetchingRef.current) return; // prevent concurrent fetches
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      // 1. Fetch Prices with 1h, 24h, 7d changes
      const coinIds = Array.from(new Set(Object.values(TOKENS).flat().map(t => t.coinGeckoId))).join(',');
      const fetchedPrices: Record<string, any> = {};

      // 1b. Parallelize CoinGecko prices + PulseChain LP reserves fetches
      const GET_RESERVES = '0x0902f1ac';
      const pcRpc = CHAINS.pulsechain.rpc;
      const lpKeys = Object.keys(PULSEX_LP_PAIRS) as (keyof typeof PULSEX_LP_PAIRS)[];

      const [cgMarketsResult, pcLpResult] = await Promise.allSettled([
        // Fetch CoinGecko markets data
        (async () => {
          const priceRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&price_change_percentage=1h,24h,7d&per_page=250&order=market_cap_desc`);
          const priceArray = await priceRes.json();
          if (Array.isArray(priceArray) && priceArray.length > 0) {
            const newLogos: Record<string, string> = {};
            priceArray.forEach((coin: any) => {
              fetchedPrices[coin.id] = {
                usd: coin.current_price,
                usd_24h_change: coin.price_change_percentage_24h_in_currency,
                usd_1h_change: coin.price_change_percentage_1h_in_currency,
                usd_7d_change: coin.price_change_percentage_7d_in_currency,
                image: coin.image
              };
              if (coin.image) newLogos[coin.id] = coin.image;
            });
            setTokenLogos(prev => ({ ...prev, ...newLogos }));
            return { success: true, pricedCount: Object.keys(fetchedPrices).length };
          }
          return { success: false };
        })(),
        // Fetch PulseChain prices from on-chain LP reserves (authoritative source per skill doc)
        // Uses getReserves() on PulseX V2 LP pairs - more reliable than subgraph which can lag/rate-limit
        (async () => {
          const batchReq = lpKeys.map((key, i) => ({
            jsonrpc: '2.0',
            id: i,
            method: 'eth_call',
            params: [{ to: PULSEX_LP_PAIRS[key], data: GET_RESERVES }, 'latest']
          }));

          const batchRes = await fetch(pcRpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchReq)
          });
          const batchData: any[] = await batchRes.json();
          return batchData;
        })()
      ]);

      // Process CoinGecko results
      if (cgMarketsResult.status === 'rejected') {
        console.warn('coins/markets failed, will try simple/price fallback');
      }

      // Fallback: if markets API returned nothing (rate limit etc), use simple/price
      if (Object.keys(fetchedPrices).length === 0) {
        try {
          const simpleRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
          const simpleData = await simpleRes.json();
          Object.entries(simpleData).forEach(([id, data]: [string, any]) => {
            fetchedPrices[id] = { usd: data.usd, usd_24h_change: data.usd_24h_change };
          });
        } catch (e) {
          console.warn('simple/price fallback also failed');
        }
      }

      // Process PulseChain LP results
      let batchData: any[] = [];
      try {
        if (pcLpResult.status === 'fulfilled') {
          batchData = pcLpResult.value;
        } else {
          console.warn('Could not fetch PulseChain on-chain LP prices');
        }
      } catch (e) {
        console.warn('Could not fetch PulseChain on-chain LP prices:', e);
      }

      if (batchData.length > 0) {
        batchData.sort((a, b) => a.id - b.id);

        const parseRes = (hex: string): [number, number] => {
          if (!hex || hex === '0x') return [0, 0];
          const d = hex.replace('0x', '').padStart(192, '0');
          // parseInt loses precision above 2^53; reserves routinely exceed this (1e24 for 18-dec tokens).
          // BigInt parses exactly, Number() then gives a safe float approximation for ratio math.
          const r0 = Number(BigInt('0x' + d.slice(0, 64)));
          const r1 = Number(BigInt('0x' + d.slice(64, 128)));
          return [r0, r1];
        };
        const reserveResult = (key: keyof typeof PULSEX_LP_PAIRS): string => {
          const idx = lpKeys.indexOf(key);
          return idx >= 0 ? (batchData[idx]?.result ?? '0x') : '0x';
        };

        // --- WPLS price from 3 stablecoin pairs; pick max (highest = most liquidity) ---
        const [daiR0, daiR1]   = parseRes(reserveResult('WPLS_DAI'));
        const [usdcR0, usdcR1] = parseRes(reserveResult('WPLS_USDC'));
        const [usdtR0, usdtR1] = parseRes(reserveResult('WPLS_USDT'));

        // WPLS/USDC: token0=pUSDC(6dec), token1=WPLS(18dec) -> plsPrice = (usdcR0/1e6) / (usdcR1/1e18)
        const plsFromUSDC = usdcR0 > 0 && usdcR1 > 0 ? (usdcR0 / 1e6) / (usdcR1 / 1e18)    : 0;
        // WPLS/USDT: same layout as USDC
        const plsFromUSDT = usdtR0 > 0 && usdtR1 > 0 ? (usdtR0 / 1e6) / (usdtR1 / 1e18)    : 0;

        // DO NOT use the DAI pair for WPLS oracle - pDAI trades far below $1 on PulseChain.
        // plsFromDAI would be "pDAI per WPLS" (not USD per WPLS), which is much larger than
        // the true USD price and would dominate Math.max(), inflating wplsUSD ~35x.
        // Use only USDC + USDT which stay close to $1.
        const wplsUSD = Math.max(plsFromUSDC, plsFromUSDT);

        if (wplsUSD > 0) {
          if (!fetchedPrices.pulsechain) fetchedPrices.pulsechain = {};
          fetchedPrices.pulsechain.usd = wplsUSD;
          fetchedPrices['pulsechain:native'] = { usd: wplsUSD };

          const setTokenPrice = (addrLower: string, priceUSD: number, cgId?: string) => {
            if (priceUSD <= 0) return;
            const existing = cgId ? (fetchedPrices[cgId] || {}) : {};
            const change24h = existing.usd_24h_change;
            fetchedPrices[`pulsechain:${addrLower}`] = { ...existing, usd: priceUSD, ...(change24h != null ? { usd_24h_change: change24h } : {}) };
          };

          // PLSX/WPLS - token0=PLSX(18), token1=WPLS(18)
          const [plsxR0, plsxR1] = parseRes(reserveResult('PLSX_WPLS'));
          if (plsxR0 > 0 && plsxR1 > 0)
            setTokenPrice('0x95b303987a60c71504d99aa1b13b4da07b0790ab', (plsxR1 / plsxR0) * wplsUSD, 'pulsex');

          // INC/WPLS - token0=INC(18), token1=WPLS(18)
          const [incR0, incR1] = parseRes(reserveResult('INC_WPLS'));
          if (incR0 > 0 && incR1 > 0)
            setTokenPrice('0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d', (incR1 / incR0) * wplsUSD, 'incentive');

          // pHEX/WPLS - token0=pHEX(8dec), token1=WPLS(18dec)
          const [hexR0, hexR1] = parseRes(reserveResult('PHEX_WPLS'));
          if (hexR0 > 0 && hexR1 > 0) {
            const pHexUSD = ((hexR1 / 1e18) / (hexR0 / 1e8)) * wplsUSD;
            setTokenPrice(ETH_HEX_ADDR, pHexUSD, 'hex');
            fetchedPrices['pulsechain:hex'] = { usd: pHexUSD };
            // eHEX must stay tied to the Ethereum HEX market. Do not fall back to
            // pHEX here, otherwise the first render shows the PulseChain HEX price
            // until the Ethereum/CoinGecko price corrects it.
            const ehexPriceData = fetchedPrices['hex'] || prices['hex'];
            if (ehexPriceData?.usd) {
              const ehexUsd = ehexPriceData.usd;
              fetchedPrices[`pulsechain:${EHEX_PULSECHAIN_ADDR}`] = {
                usd: ehexUsd,
                usd_24h_change: ehexPriceData.usd_24h_change,
                usd_1h_change: ehexPriceData.usd_1h_change,
                usd_7d_change: ehexPriceData.usd_7d_change,
              };
              fetchedPrices[`ethereum:${ETH_HEX_ADDR}`] = {
                usd: ehexUsd,
                usd_24h_change: ehexPriceData.usd_24h_change,
                usd_1h_change: ehexPriceData.usd_1h_change,
                usd_7d_change: ehexPriceData.usd_7d_change,
              };
            }
          } else {
            // On-chain LP failed - fall back to CoinGecko for both HEX variants
            const cgHex = fetchedPrices['hex']?.usd;
            if (cgHex) {
              fetchedPrices[`pulsechain:${ETH_HEX_ADDR}`] = { usd: cgHex, usd_24h_change: fetchedPrices['hex']?.usd_24h_change };
              fetchedPrices['pulsechain:hex'] = { usd: cgHex };
              fetchedPrices[`pulsechain:${EHEX_PULSECHAIN_ADDR}`] = { usd: cgHex, usd_24h_change: fetchedPrices['hex']?.usd_24h_change };
              fetchedPrices[`ethereum:${ETH_HEX_ADDR}`] = { usd: cgHex, usd_24h_change: fetchedPrices['hex']?.usd_24h_change };
            }
          }

          // pWETH/WPLS - token0=pWETH(18), token1=WPLS(18)
          const [wethR0, wethR1] = parseRes(reserveResult('PWETH_WPLS'));
          if (wethR0 > 0 && wethR1 > 0) {
            const ethFromLp = (wethR1 / wethR0) * wplsUSD;
            setTokenPrice('0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c', ethFromLp, 'ethereum');
            // Propagate ETH price to the native-token keys used by ETH balance valuation and
            // transaction valueUsd fallback.  CoinGecko covers these when available; this ensures
            // they are never $0 when CoinGecko is rate-limited, so netInvestment stays correct.
            if (!fetchedPrices['ethereum']?.usd) {
              fetchedPrices['ethereum'] = { usd: ethFromLp };
            }
            if (!fetchedPrices['ethereum:native']?.usd) {
              fetchedPrices['ethereum:native'] = { usd: ethFromLp };
            }
            if (!fetchedPrices['base:native']?.usd) {
              fetchedPrices['base:native'] = { usd: ethFromLp };
            }
          }

          // pWBTC/WPLS - REVERSED: token0=WPLS(18), token1=pWBTC(8)
          const [wbtcR0, wbtcR1] = parseRes(reserveResult('PWBTC_WPLS'));
          if (wbtcR0 > 0 && wbtcR1 > 0)
            setTokenPrice('0xb17d901469b9208b17d916112988a3fed19b5ca1', ((wbtcR0 / 1e18) / (wbtcR1 / 1e8)) * wplsUSD, 'wrapped-bitcoin');

          // Bridged stablecoin prices derived from LP - these do NOT trade at $1 on PulseChain
          // WPLS/DAI: token0=WPLS(18), token1=pDAI(18) -> pDAI_USD = (daiR0/daiR1) * wplsUSD
          if (daiR0 > 0 && daiR1 > 0)
            setTokenPrice('0xefd766ccb38eaf1dfd701853bfce31359239f305', (daiR0 / daiR1) * wplsUSD);
          // WPLS/USDC: token0=pUSDC(6dec), token1=WPLS(18dec) -> pUSDC_USD = (usdcR1/1e18)/(usdcR0/1e6) * wplsUSD
          if (usdcR0 > 0 && usdcR1 > 0)
            setTokenPrice('0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07', (usdcR1 / 1e18) / (usdcR0 / 1e6) * wplsUSD);
          // WPLS/USDT: token0=pUSDT(6dec), token1=WPLS(18dec) -> pUSDT_USD = (usdtR1/1e18)/(usdtR0/1e6) * wplsUSD
          if (usdtR0 > 0 && usdtR1 > 0)
            setTokenPrice('0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f', (usdtR1 / 1e18) / (usdtR0 / 1e6) * wplsUSD);
          // System copy pDAI (0x6b175474... - Ethereum's DAI address, fork-copied)
          // token0=pDAI_sys(18dec), token1=WPLS(18dec) -> pDAI_sys_USD = (sysR1/sysR0) * wplsUSD
          const [sysR0, sysR1] = parseRes(reserveResult('PDAI_SYS_WPLS'));
          if (sysR0 > 0 && sysR1 > 0)
            setTokenPrice('0x6b175474e89094c44da98b954eedeac495271d0f', (sysR1 / sysR0) * wplsUSD);
          // PRVX: use high-liquidity USDC pair ($1M) - token0=pUSDC(6dec), token1=PRVX(18dec)
          // Direct stablecoin price - no WPLS conversion needed
          const [prvxR0, prvxR1] = parseRes(reserveResult('PRVX_USDC'));
          if (prvxR0 > 0 && prvxR1 > 0)
            setTokenPrice('0xf6f8db0aba00007681f8faf16a0fda1c9b030b11', (prvxR0 / 1e6) / (prvxR1 / 1e18));
        }
      }

      setPrices(prev => ({ ...prev, ...fetchedPrices }));

      const assetMap: Record<string, Asset> = {};
      const walletAssetMap: Record<string, Record<string, Asset>> = {};
      const allStakes: HexStake[] = [];
      const allTransactions: Transaction[] = [];

      // Helper for retrying RPC calls
      const withRetry = async <T,>(fn: () => Promise<T>, retries = 5, delay = 1000): Promise<T> => {
        try {
          return await fn();
        } catch (e: any) {
          const errMsg = e.message?.toLowerCase() || '';
          const shouldRetry =
            retries > 0 && (
              errMsg.includes('rate limit') ||
              errMsg.includes('429') ||
              errMsg.includes('request failed') ||
              errMsg.includes('internal error') ||
              errMsg.includes('timeout') ||
              errMsg.includes('retry')
            );

          if (shouldRetry) {
            console.warn(`RPC call failed, retrying... (${retries} left). Error: ${errMsg.slice(0, 100)}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 1.5);
          }
          throw e;
        }
      };

      // 2. Fetch Balances and Transactions for each chain
      for (const chainKey of Object.keys(CHAINS) as Chain[]) {
        const chainConfig = CHAINS[chainKey];
        if (!chainConfig) continue;

        const transports = [http(chainConfig.rpc)];
        if ((chainConfig as any).fallbackRpcs) {
          (chainConfig as any).fallbackRpcs.forEach((rpc: string) => {
            transports.push(http(rpc));
          });
        }

        const client = createPublicClient({
          transport: fallback(transports, { rank: true })
        });

        // Parallelize wallet processing for each chain
        await Promise.all(wallets.map(async (wallet) => {
          const address = wallet.address as `0x${string}`;
          const discoveredTokens: any[] = [];

          // 1. Fetch Transactions and discovered tokens in parallel
          try {
            if (chainKey === 'pulsechain') {
              // Vite dev + Vercel production rewrite /proxy/pulsechain/* to api.scan.pulsechain.com.
              // Electron and non-proxy hosts (custom domains, mobile PWAs, GitHub Pages) hit direct.
              const bsBase = resolveBlockscoutBase();
              const nativePrice = fetchedPrices['pulsechain']?.usd || 0;

              const fetchPcV2Pages = async (endpoint: string, maxPages = 50): Promise<any[]> => {
                const results: any[] = [];
                let nextParams: Record<string, string> | null = {};
                let page = 0;
                while (nextParams !== null && page < maxPages) {
                  const hasExistingQuery = endpoint.includes('?');
                  const paramStr = Object.keys(nextParams).length
                    ? (hasExistingQuery ? '&' : '?') + new URLSearchParams(nextParams).toString()
                    : '';
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 58000);
                  let res: Response;
                  try {
                    res = await fetch(`${bsBase}${endpoint}${paramStr}`, { signal: controller.signal });
                  } catch {
                    console.warn(`[pulsechain] ${endpoint} -> timeout/network error`);
                    break;
                  } finally {
                    clearTimeout(timeout);
                  }
                  if (!res.ok) { console.warn(`[pulsechain] ${endpoint} -> HTTP ${res.status}`); break; }
                  const data = await res.json();
                  if (data.items && Array.isArray(data.items)) {
                    results.push(...data.items);
                    nextParams = data.next_page_params || null;
                    if (!data.next_page_params || data.items.length === 0) break;
                  } else {
                    break;
                  }
                  page++;
                }
                return results;
              };

              const fetchPcTokenBalances = async (): Promise<any[]> => {
                try {
                  return await fetchPcV2Pages(`/addresses/${address}/tokens?type=ERC-20`, 20);
                } catch (e) {
                  console.warn(`[pulsechain] token balance discovery failed for ${address}:`, e);
                  return [];
                }
              };

              // Etherscan-compat base - same proxy logic as above
              const esBase = resolveEtherscanCompatBase();

              // Fetch per-token transfers in parallel using Etherscan-compat API.
              // Per-token queries use a contract index and are ~instant even for active wallets,
              // unlike the V2 /token-transfers endpoint which times out for busy addresses.
              const pcTokenContracts = (TOKENS['pulsechain'] as any[]).filter(t => t.address !== 'native');

              const fetchEsTokenTx = async (contractAddress: string): Promise<any[]> => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                try {
                  const url = `${esBase}?module=account&action=tokentx&address=${address}&contractaddress=${contractAddress}&page=1&offset=50&sort=desc`;
                  const res = await fetch(url, { signal: controller.signal });
                  if (!res.ok) return [];
                  const data = await res.json();
                  if (data.status === '1' && Array.isArray(data.result)) return data.result;
                  return [];
                } catch {
                  return [];
                } finally {
                  clearTimeout(timeout);
                }
              };

              const [bsTxs, bsTokenBalances, esTokenArrays] = await Promise.all([
                fetchPcV2Pages(`/addresses/${address}/transactions`),
                fetchPcTokenBalances(),
                Promise.all(pcTokenContracts.map(t => fetchEsTokenTx(t.address)))
              ]);

              // Normalise Etherscan-compat records to the V2 shape the processing loop expects,
              // then deduplicate by txHash+logIndex (same tx may appear across token queries).
              const seen = new Set<string>();
              const bsTokenTxs = esTokenArrays.flat().reduce<any[]>((acc, tx) => {
                const key = `${tx.hash}-${tx.logIndex ?? tx.transactionIndex ?? Math.random()}`;
                if (seen.has(key)) return acc;
                seen.add(key);
                acc.push({
                  from: { hash: tx.from },
                  to: { hash: tx.to },
                  token: { symbol: tx.tokenSymbol, decimals: tx.tokenDecimal, address: tx.contractAddress },
                  total: { value: tx.value },
                  transaction_hash: tx.hash,
                  timestamp: tx.timeStamp ? new Date(Number(tx.timeStamp) * 1000).toISOString() : null,
                  log_index: tx.logIndex,
                  method: null,
                });
                return acc;
              }, []);

              // Native PLS transactions
              bsTxs.forEach((tx: any) => {
                const isOut = (tx.from?.hash || '').toLowerCase() === address.toLowerCase();
                const amount = Number(formatUnits(BigInt(tx.value || '0'), 18));
                const valueUsd = amount * nativePrice;
                const ts = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
                allTransactions.push({
                  id: tx.hash,
                  hash: tx.hash,
                  timestamp: ts,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from?.hash || '',
                  to: tx.to?.hash || '',
                  asset: 'PLS',
                  amount,
                  chain: 'pulsechain',
                  valueUsd,
                  fee: tx.gas_used && tx.gas_price
                    ? Number(formatUnits(BigInt(tx.gas_used) * BigInt(tx.gas_price), 18))
                    : 0
                });
              });

              // PulseChain token transfers
              const pulseBridgeMap: Record<string, { name: string, id: string }> = {
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC (fork copy)', id: 'usd-coin' },
                '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI (fork copy)', id: 'dai' },
                '0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07': { name: 'USDC (from ETH)', id: 'usd-coin' },
                '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c': { name: 'WETH (from ETH)', id: 'ethereum' },
                '0xefd766ccb38eaf1dfd701853bfce31359239f305': { name: 'DAI (from ETH)', id: 'dai' },
                '0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f': { name: 'USDT (from ETH)', id: 'tether' },
                '0x57fde0a71132198bbec939b98976993d8d89d225': { name: 'HEX (from ETH)', id: 'hex' },
                '0xb17d901469b9208b17d916112988a3fed19b5ca1': { name: 'WBTC (from ETH)', id: 'wrapped-bitcoin' },
                '0x80316335349e52643527c6986816e6c483478248': { name: 'USDC (Liberty Bridge)', id: 'usd-coin' },
                '0x41527c4d9d47ef03f00f77d794c87ba94832700b': { name: 'USDC (from Base)', id: 'usd-coin' }
              };

              const addDiscoveredPulseToken = (tokenInfo: any, markNoMarketAsSpam = false) => {
                const contractAddr = (tokenInfo?.address || '').toLowerCase();
                if (!contractAddr) return;

                const chainTokens = TOKENS['pulsechain'] || [];
                const isHardcoded = chainTokens.some((t: any) => t.address !== 'native' && t.address.toLowerCase() === contractAddr);
                const isAlreadyDiscovered = discoveredTokens.some(t => t.address.toLowerCase() === contractAddr);
                if (isHardcoded || isAlreadyDiscovered) return;

                const symbol = String(tokenInfo?.symbol || 'TOKEN');
                const mapped = pulseBridgeMap[contractAddr];
                const name = mapped?.name || String(tokenInfo?.name || symbol);
                const decimals = Number(tokenInfo?.decimals) || 18;
                const exchangeRate = Number(tokenInfo?.exchange_rate ?? tokenInfo?.exchangeRate ?? NaN);
                const priceKey = `pulsechain:${contractAddr}`;
                if (Number.isFinite(exchangeRate) && exchangeRate > 0 && !fetchedPrices[priceKey]?.usd) {
                  fetchedPrices[priceKey] = { ...(fetchedPrices[priceKey] || {}), usd: exchangeRate };
                }

                const hasUrlPattern = /\.(io|com|net|org|xyz|finance|app|pro|gg|gd)\b/i.test(`${name} ${symbol}`);
                const hasNoMarket = !tokenInfo?.exchange_rate && !tokenInfo?.circulating_market_cap && !tokenInfo?.volume_24h;
                const isSpam = hasUrlPattern || (markNoMarketAsSpam && hasNoMarket && !mapped);

                discoveredTokens.push({
                  symbol,
                  name,
                  address: tokenInfo.address || contractAddr,
                  decimals,
                  coinGeckoId: mapped?.id || symbol.toLowerCase(),
                  bridged: !!mapped,
                  isSpam,
                  isDiscovered: true
                });
              };

              bsTokenBalances.forEach((item: any) => {
                const tokenInfo = item?.token || item;
                const rawValue = BigInt(item?.value || '0');
                if (rawValue > 0n) addDiscoveredPulseToken(tokenInfo);
              });

              bsTokenTxs.forEach((tx: any) => {
                const isOut = (tx.from?.hash || '').toLowerCase() === address.toLowerCase();
                const symbol = tx.token?.symbol || 'TOKEN';
                const decimals = Number(tx.token?.decimals) || 18;
                const contractAddr = (tx.token?.address || '').toLowerCase();
                const amount = Number(formatUnits(BigInt(tx.total?.value || '0'), decimals));
                const ts = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;

                const mapped = pulseBridgeMap[contractAddr];
                const assetName = mapped ? mapped.name : symbol;
                const coinGeckoId = mapped ? mapped.id : symbol.toLowerCase();
                const priceKey = `pulsechain:${contractAddr}`;
                const price = fetchedPrices[priceKey]?.usd ||
                              fetchedPrices[contractAddr]?.usd ||
                              fetchedPrices[coinGeckoId]?.usd || 0;
                const valueUsd = amount * price;

                allTransactions.push({
                  id: `${tx.transaction_hash}-${tx.log_index || Math.random()}`,
                  hash: tx.transaction_hash || tx.hash || '',
                  timestamp: ts,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from?.hash || '',
                  to: tx.to?.hash || '',
                  asset: assetName,
                  amount,
                  chain: 'pulsechain',
                  valueUsd,
                  fee: 0
                });

                addDiscoveredPulseToken(tx.token, !isOut);
              });

            } else if (chainKey === 'base') {
              // Base uses Blockscout V2 API
              const bsBase = 'https://base.blockscout.com/api/v2';

              const fetchBlockscoutPages = async (endpoint: string): Promise<any[]> => {
                const results: any[] = [];
                let nextParams: Record<string, string> | null = {};
                while (nextParams !== null) {
                  const hasExistingQuery = endpoint.includes('?');
                  const paramStr = Object.keys(nextParams).length
                    ? (hasExistingQuery ? '&' : '?') + new URLSearchParams(nextParams).toString()
                    : '';
                  const res = await fetch(`${bsBase}${endpoint}${paramStr}`);
                  const data = await res.json();
                  if (data.items && Array.isArray(data.items)) {
                    results.push(...data.items);
                    nextParams = data.next_page_params || null;
                    if (!data.next_page_params || data.items.length === 0) break;
                  } else {
                    break;
                  }
                }
                return results;
              };

              const [bsTxs, bsTokenTxs] = await Promise.all([
                fetchBlockscoutPages(`/addresses/${address}/transactions`),
                fetchBlockscoutPages(`/addresses/${address}/token-transfers?type=ERC-20`)
              ]);

              const nativePrice = fetchedPrices['ethereum']?.usd || 0;

              // Build Liberty Swap metadata map: tx hash -> bridge data
              const libertySwapMap = new Map<string, { dstChainId: number; orderId: string }>();

              bsTxs.forEach((tx: any) => {
                const isOut = (tx.from?.hash || '').toLowerCase() === address.toLowerCase();
                const amount = Number(formatUnits(BigInt(tx.value || '0'), 18));
                const valueUsd = amount * nativePrice;
                const ts = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
                const toAddr = (tx.to?.hash || '').toLowerCase();

                // Detect Liberty Swap: outbound tx to the Liberty Swap Router on Base
                if (isOut && toAddr === LIBERTY_SWAP_ROUTERS.base) {
                  const rawInput = tx.raw_input || tx.input || '';
                  const lsData = decodeLibertySwapInput(rawInput);
                  if (lsData) libertySwapMap.set(tx.hash.toLowerCase(), lsData);
                }

                allTransactions.push({
                  id: tx.hash,
                  hash: tx.hash,
                  timestamp: ts,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from?.hash || '',
                  to: tx.to?.hash || '',
                  asset: 'ETH',
                  amount,
                  chain: 'base',
                  valueUsd,
                  fee: tx.gas_used && tx.gas_price
                    ? Number(formatUnits(BigInt(tx.gas_used) * BigInt(tx.gas_price), 18))
                    : 0
                });
              });

              const baseBridgeMap: Record<string, { name: string, id: string }> = {
                '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { name: 'USDC', id: 'usd-coin' },
                '0x4200000000000000000000000000000000000006': { name: 'WETH', id: 'ethereum' },
                '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { name: 'DAI', id: 'dai' },
              };

              bsTokenTxs.forEach((tx: any) => {
                const isOut = (tx.from?.hash || '').toLowerCase() === address.toLowerCase();
                const symbol = tx.token?.symbol || 'TOKEN';
                const decimals = Number(tx.token?.decimals) || 18;
                const contractAddr = (tx.token?.address || '').toLowerCase();
                const amount = Number(formatUnits(BigInt(tx.total?.value || '0'), decimals));
                const ts = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
                const txHash = (tx.transaction_hash || tx.hash || '').toLowerCase();

                const mapped = baseBridgeMap[contractAddr];
                const assetName = mapped ? mapped.name : symbol;
                const coinGeckoId = mapped ? mapped.id : symbol.toLowerCase();
                const price = fetchedPrices[coinGeckoId]?.usd ||
                              fetchedPrices[contractAddr]?.usd || 0;
                const valueUsd = amount * price;

                const lsData = libertySwapMap.get(txHash);

                allTransactions.push({
                  id: `${tx.transaction_hash}-${tx.log_index || Math.random()}`,
                  hash: tx.transaction_hash || tx.hash || '',
                  timestamp: ts,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from?.hash || '',
                  to: tx.to?.hash || '',
                  asset: assetName,
                  amount,
                  chain: 'base',
                  valueUsd,
                  fee: 0,
                  ...(lsData ? { libertySwap: lsData } : {}),
                });

                const chainTokens = TOKENS['base'] || [];
                const isHardcoded = chainTokens.some((t: any) => t.address.toLowerCase() === contractAddr);
                const isAlreadyDiscovered = discoveredTokens.some(t => t.address.toLowerCase() === contractAddr);
                if (!isHardcoded && !isAlreadyDiscovered && contractAddr) {
                  const isBatchAirdrop = tx.method === 'batchTransfer' || tx.method === 'multiSend';
                  const hasNoMarket = !tx.token?.exchange_rate && !tx.token?.circulating_market_cap && !tx.token?.volume_24h;
                  const isSpam = !isOut && (isBatchAirdrop || (hasNoMarket && !mapped));
                  discoveredTokens.push({
                    symbol,
                    name: assetName,
                    address: tx.token?.address || contractAddr,
                    decimals,
                    coinGeckoId,
                    bridged: !!mapped,
                    isSpam
                  });
                }
              });
            } else {
            // Etherscan V2 path for Ethereum
            const apiBase = 'https://api.etherscan.io/v2/api?chainid=1';

            // ETH block ~11565019 = Jan 1 2021
            const startBlock = '11565019';
            const pageSize = 10000;
            const sortDir = 'asc';

            const apiKey = etherscanApiKey || import.meta.env.VITE_ETHERSCAN_API_KEY || '';

            const fetchAllTxPages = async (action: string): Promise<any[]> => {
              const results: any[] = [];
              let page = 1;
              let retries = 0;
              while (true) {
                const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
                const sep = apiBase.includes('?') ? '&' : '?';
                const url = `${apiBase}${sep}module=account&action=${action}&address=${address}` +
                  `&startblock=${startBlock}&endblock=99999999&sort=${sortDir}&page=${page}&offset=${pageSize}${apiKeyParam}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === '1' && Array.isArray(data.result)) {
                  results.push(...data.result);
                  if (data.result.length < pageSize) break;
                  page++;
                  retries = 0;
                } else {
                  const msg = (data.result || data.message || '').toString().toLowerCase();
                  if ((msg.includes('rate limit') || msg.includes('max rate')) && retries < 3) {
                    retries++;
                    await new Promise(r => setTimeout(r, 1500 * retries));
                    continue;
                  }
                  if (data.status !== '0' || (data.message !== 'No transactions found' && !msg.includes('no transactions'))) {
                    console.warn(`[${chainKey}] ${action} API response:`, data.status, data.message, msg.slice(0, 100));
                  }
                  break;
                }
              }
              return results;
            };

            const [txResults, tokenTxResults, internalTxResults] = await Promise.all([
              fetchAllTxPages('txlist'),
              fetchAllTxPages('tokentx'),
              fetchAllTxPages('txlistinternal')
            ]);

            const txData = { status: txResults.length ? '1' : '0', result: txResults };
            const tokenTxData = { status: tokenTxResults.length ? '1' : '0', result: tokenTxResults };

            if (txData.status === '1' && Array.isArray(txData.result)) {
              txData.result.forEach((tx: any) => {
                const isOut = tx.from.toLowerCase() === address.toLowerCase();
                const amount = Number(formatUnits(BigInt(tx.value), 18));
                const price = fetchedPrices['ethereum']?.usd || 0;
                const valueUsd = amount * price;

                allTransactions.push({
                  id: tx.hash,
                  hash: tx.hash,
                  timestamp: Number(tx.timeStamp) * 1000,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from,
                  to: tx.to,
                  asset: 'ETH',
                  amount: amount,
                  chain: chainKey,
                  valueUsd: valueUsd,
                  fee: Number(formatUnits(BigInt(tx.gasUsed) * BigInt(tx.gasPrice), 18))
                });
              });
            }

            if (tokenTxData.status === '1' && Array.isArray(tokenTxData.result)) {
              tokenTxData.result.forEach((tx: any) => {
                const isOut = tx.from.toLowerCase() === address.toLowerCase();
                const symbol = tx.tokenSymbol || 'TOKEN';
                const decimals = Number(tx.tokenDecimal) || 18;
                const contractAddr = tx.contractAddress.toLowerCase();

                const assetName = symbol;
                const isBridged = false;
                // Look up coinGeckoId from the hardcoded TOKENS list first (e.g. USDC -> 'usd-coin',
                // USDT -> 'tether') instead of blindly lowercasing the symbol which gives wrong keys.
                const knownEthToken = TOKENS['ethereum'].find((t: any) => t.address.toLowerCase() === contractAddr);
                const coinGeckoId = knownEthToken?.coinGeckoId || symbol.toLowerCase();

                const amount = Number(formatUnits(BigInt(tx.value), decimals));
                const price = fetchedPrices[contractAddr]?.usd ||
                             fetchedPrices[coinGeckoId]?.usd || 0;
                const valueUsd = amount * price;

                allTransactions.push({
                  id: `${tx.hash}-${tx.logIndex}`,
                  hash: tx.hash,
                  timestamp: Number(tx.timeStamp) * 1000,
                  type: isOut ? 'withdraw' : 'deposit',
                  from: tx.from,
                  to: tx.to,
                  asset: assetName,
                  amount: amount,
                  chain: chainKey,
                  valueUsd: valueUsd,
                  fee: tx.gasUsed ? Number(formatUnits(BigInt(tx.gasUsed) * BigInt(tx.gasPrice), 18)) : 0
                });

                const isHardcoded = TOKENS[chainKey].some(t => t.address.toLowerCase() === contractAddr);
                const isAlreadyDiscovered = discoveredTokens.some(t => t.address.toLowerCase() === contractAddr);

                if (!isHardcoded && !isAlreadyDiscovered) {
                  // Spam: URL in name/symbol, or tiny airdrop amount (~10 tokens) with no price
                  const hasUrlPattern = /\.(io|com|net|org|xyz|finance|app|pro|gg)\b/i.test(assetName + ' ' + symbol);
                  const isTinyAirdrop = !isOut && price === 0 && amount <= 10;
                  const isEthSpam = !isOut && (hasUrlPattern || isTinyAirdrop);
                  discoveredTokens.push({
                    symbol,
                    name: assetName,
                    address: tx.contractAddress,
                    decimals,
                    coinGeckoId,
                    bridged: isBridged,
                    isSpam: isEthSpam
                  });
                }
              });
            }

            // Internal ETH transfers - captures the ETH received/sent leg of token-to-ETH swaps
            // (e.g. selling USDC for ETH: the ETH comes back via an internal call from the router)
            internalTxResults.forEach((tx: any, i: number) => {
              const isOut = (tx.from || '').toLowerCase() === address.toLowerCase();
              const isIn  = (tx.to  || '').toLowerCase() === address.toLowerCase();
              if (!isOut && !isIn) return;
              const amount = Number(formatUnits(BigInt(tx.value || '0'), 18));
              if (amount <= 0) return;
              const price = fetchedPrices['ethereum']?.usd || 0;
              allTransactions.push({
                id: `${tx.hash}-internal-${i}`,
                hash: tx.hash,
                timestamp: Number(tx.timeStamp) * 1000,
                type: isOut ? 'withdraw' : 'deposit',
                from: tx.from || '',
                to: tx.to || '',
                asset: 'ETH',
                amount,
                chain: chainKey,
                valueUsd: amount * price,
                fee: 0
              });
            });
            } // end else (ethereum/base)
          } catch (e) {
            console.warn(`Could not fetch transactions for ${address} on ${chainKey}:`, e);
          }

          // 2a. Parallelize DexScreener (PulseChain) + DefiLlama (Ethereum) price fetches
          await Promise.allSettled([
            // DexScreener metadata for discovered PulseChain wallet tokens
            (async () => {
              if (chainKey !== 'pulsechain' || discoveredTokens.length === 0) return;
              try {
                const discoveredByAddr = new Map(
                  discoveredTokens
                    .filter(t => t.address && t.address !== 'native')
                    .map(t => [t.address.toLowerCase(), t])
                );
                const unpricedAddrs = Array.from(discoveredByAddr.keys())
                  .filter(addr => !fetchedPrices[`pulsechain:${addr}`]?.usd);

                if (unpricedAddrs.length === 0) return;

                const chunks: string[][] = [];
                for (let i = 0; i < unpricedAddrs.length; i += 30) {
                  chunks.push(unpricedAddrs.slice(i, i + 30));
                }

                const bestPairs = new Map<string, any>();
                await Promise.all(chunks.map(async (chunk) => {
                  const res = await fetch(`https://api.dexscreener.com/tokens/v1/pulsechain/${chunk.join(',')}`);
                  if (!res.ok) return;
                  const pairs = await res.json();
                  if (!Array.isArray(pairs)) return;

                  pairs.forEach((pair: any) => {
                    const baseAddr = pair?.baseToken?.address?.toLowerCase?.();
                    const quoteAddr = pair?.quoteToken?.address?.toLowerCase?.();
                    const matchedAddr = discoveredByAddr.has(baseAddr) ? baseAddr : discoveredByAddr.has(quoteAddr) ? quoteAddr : null;
                    if (!matchedAddr) return;

                    const current = bestPairs.get(matchedAddr);
                    const currentLiquidity = Number(current?.liquidity?.usd ?? 0);
                    const nextLiquidity = Number(pair?.liquidity?.usd ?? 0);
                    if (!current || nextLiquidity > currentLiquidity) bestPairs.set(matchedAddr, pair);
                  });
                }));

                const newLogos: Record<string, string> = {};
                bestPairs.forEach((pair, addr) => {
                  const token = discoveredByAddr.get(addr);
                  if (!token) return;

                  const baseAddr = pair?.baseToken?.address?.toLowerCase?.();

                  const pairToken = baseAddr === addr ? pair?.baseToken : pair?.quoteToken;
                  if (pairToken?.symbol && token.symbol === 'TOKEN') token.symbol = pairToken.symbol;
                  if (pairToken?.name && (!token.name || token.name === token.symbol)) token.name = pairToken.name;
                  if (pair?.info?.imageUrl) newLogos[addr] = pair.info.imageUrl;
                });

                if (Object.keys(newLogos).length > 0) {
                  setTokenLogos(prev => ({ ...prev, ...newLogos }));
                }
              } catch (e) {
                console.warn('DexScreener PulseChain token lookup failed:', e);
              }
            })(),
            // DeFi Llama prices for discovered Ethereum tokens
            (async () => {
              if (chainKey !== 'ethereum' || discoveredTokens.length === 0) return;
              try {
                const unpricedAddrs = discoveredTokens
                  .filter(t => t.address && t.address !== 'native' && !fetchedPrices[t.address.toLowerCase()])
                  .map(t => `ethereum:${t.address.toLowerCase()}`);
                if (unpricedAddrs.length === 0) return;

                const llamaRes = await fetch(`https://coins.llama.fi/prices/current/${unpricedAddrs.join(',')}`);
                if (llamaRes.ok) {
                  const llamaData = await llamaRes.json();
                  const newLogos: Record<string, string> = {};
                  Object.entries(llamaData.coins || {}).forEach(([key, val]: [string, any]) => {
                    const addr = key.replace('ethereum:', '');
                    fetchedPrices[addr] = { usd: val.price, image: val.logo };
                    fetchedPrices[key] = { usd: val.price, image: val.logo };
                    if (val.logo) newLogos[addr] = val.logo;
                  });
                  if (Object.keys(newLogos).length > 0) setTokenLogos(prev => ({ ...prev, ...newLogos }));
                }
              } catch { /* ignore */ }
            })()
          ]);

          // 2. Fetch all token balances in parallel
          const tokensToFetch = [...TOKENS[chainKey], ...discoveredTokens];
          await Promise.all(tokensToFetch.map(async (token) => {
            let balance = 0n;
            try {
              if (token.address === 'native') {
                balance = await withRetry(() => client.getBalance({ address }));
              } else {
                let checksummedAddr: `0x${string}`;
                try {
                  checksummedAddr = getAddress(token.address);
                } catch {
                  console.warn(`Skipping ${token.symbol} on ${chainKey}: invalid address ${token.address}`);
                  return;
                }
                const data = await withRetry(() => client.readContract({
                  address: checksummedAddr,
                  abi: ERC20_ABI,
                  functionName: 'balanceOf',
                  args: [address]
                } as any));
                balance = BigInt(data as any);
              }
            } catch (e) {
              if (isNoContractDataError(e)) return;
              if (import.meta.env.DEV) console.debug(`Could not fetch balance for ${token.symbol} on ${chainKey}:`, e);
              return;
            }

            const balanceNum = Number(formatUnits(balance, token.decimals));
            if (balanceNum > 0) {
              const priceKey = `${chainKey}:${token.address.toLowerCase()}`;
              const priceData = fetchedPrices[priceKey] || fetchedPrices[token.address.toLowerCase()] || fetchedPrices[token.coinGeckoId];
              const price = priceData?.usd || 0;
              const priceChange24h = priceData?.usd_24h_change ?? fetchedPrices[token.coinGeckoId]?.usd_24h_change ?? 0;
              const priceChange1h = priceData?.usd_1h_change ?? fetchedPrices[token.coinGeckoId]?.usd_1h_change ?? 0;
              const priceChange7d = priceData?.usd_7d_change ?? fetchedPrices[token.coinGeckoId]?.usd_7d_change ?? 0;
              // WPLS (wrapped native PLS) is economically equivalent to PLS.
              // Merge it into the 'pulsechain-PLS' bucket so users see one unified PLS entry.
              // LP pair internals still reference WPLS by address - only wallet holdings are merged.
              const isWplsMerge = chainKey === 'pulsechain' && token.symbol === 'WPLS';
              const isAddressKeyedDiscovery = Boolean((token as any).isDiscovered && token.address !== 'native');
              const assetKey = isWplsMerge
                ? 'pulsechain-PLS'
                : isAddressKeyedDiscovery
                  ? `${chainKey}-${token.address.toLowerCase()}`
                  : `${chainKey}-${token.symbol}`;

              if (assetMap[assetKey]) {
                assetMap[assetKey].balance += balanceNum;
                assetMap[assetKey].value += balanceNum * price;
                if (isWplsMerge) (assetMap[assetKey] as any).wrappedBalance = ((assetMap[assetKey] as any).wrappedBalance || 0) + balanceNum;
              } else {
                // Logo priority: STATIC_LOGOS (highest) -> CoinGecko/chain-CDN -> PulseX CDN
                // All CDN paths require EIP-55 checksummed addresses - use getAddress() to ensure that.
                // For WPLS merge: use the PLS/WPLS logo (same icon on PulseX CDN).
                const effectiveAddress = isWplsMerge ? 'native' : token.address;
                const addrLower = effectiveAddress === 'native' ? null : effectiveAddress.toLowerCase();
                // STATIC_LOGOS always wins - prevents CoinGecko golden-coin from replacing hand-curated logos
                const staticLogoOverride = addrLower ? STATIC_LOGOS[addrLower] : null;
                // Only fetch CoinGecko image if there's no static override (don't let coinGeckoId image pollute bridged tokens)
                const cgLogo = staticLogoOverride ? null : (priceData?.image ?? null);
                const twChain = chainKey === 'ethereum' ? 'ethereum' : chainKey === 'base' ? 'base' : null;
                let twLogo: string | null = null;
                if (!staticLogoOverride && twChain && effectiveAddress !== 'native') {
                  try { twLogo = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twChain}/assets/${getAddress(effectiveAddress)}/logo.png`; } catch { /* invalid address */ }
                }
                let pulsexLogo: string | null = null;
                if (!staticLogoOverride && chainKey === 'pulsechain' && token.address !== 'native') {
                  try { pulsexLogo = `https://tokens.app.pulsex.com/images/tokens/${getAddress(token.address)}.png`; } catch { /* invalid address */ }
                }
                const logoUrl = staticLogoOverride || cgLogo || twLogo || pulsexLogo || null;

                assetMap[assetKey] = {
                  id: assetKey,
                  symbol: isWplsMerge ? 'PLS' : token.symbol,
                  name: isWplsMerge ? 'PulseChain' : ((token as any).name || (token.symbol === 'eHEX' ? 'HEX (from Ethereum)' : `${token.symbol} (${chainConfig.name})`)),
                  balance: balanceNum,
                  price: price,
                  priceChange24h: priceChange24h,
                  priceChange1h: priceChange1h,
                  priceChange7d: priceChange7d,
                  value: balanceNum * price,
                  chain: chainKey,
                  pnl24h: priceChange24h,
                  isCore: true,
                  isBridged: false,
                  address: effectiveAddress,
                  isSpam: false,
                  logoUrl,
                  wrappedBalance: isWplsMerge ? balanceNum : 0,
                } as any;
              }

              // Per-wallet asset tracking
              const wAddr = wallet.address.toLowerCase();
              if (!walletAssetMap[wAddr]) walletAssetMap[wAddr] = {};
              if (walletAssetMap[wAddr][assetKey]) {
                walletAssetMap[wAddr][assetKey].balance += balanceNum;
                walletAssetMap[wAddr][assetKey].value += balanceNum * price;
              } else {
                walletAssetMap[wAddr][assetKey] = {
                  ...assetMap[assetKey],
                  balance: balanceNum,
                  value: balanceNum * price,
                  id: `${wAddr}-${assetKey}`,
                } as any;
              }
            }
          }));

          // 3. Fetch HEX Stakes if on PulseChain or Ethereum
          if ((chainKey === 'pulsechain' || chainKey === 'ethereum') && 'hexAddress' in chainConfig) {
            // Each chain is fully isolated: a failure on Ethereum never blocks PulseChain.
            let hexStakeCount = 0n;
            let hexCurrentDay = 0n;

            try {
              const hexAddr = getAddress(chainConfig.hexAddress);
              // PulseChain stake reads are critical for the HEX dashboard. Use the
              // primary RPC directly here so fallback ranking never lands on a
              // partially-compatible endpoint for HEX contract reads.
              const stakeClient = chainKey === 'pulsechain'
                ? createPublicClient({ transport: http(chainConfig.rpc) })
                : client;

              // Fetch stakeCount and currentDay in separate try/catch so one bad RPC
              // call cannot kill the other - they are independent contract reads.
              try {
                hexStakeCount = await withRetry(() => stakeClient.readContract({
                  address: hexAddr, abi: HEX_ABI, functionName: 'stakeCount', args: [address],
                } as any)) as bigint;
              } catch (e: any) {
                console.error(`[HEX stakes] stakeCount failed on ${chainKey} (${address.slice(0, 8)}...): ${e?.shortMessage ?? e?.message ?? String(e)}`);
              }

              try {
                hexCurrentDay = await withRetry(() => stakeClient.readContract({
                  address: hexAddr, abi: HEX_ABI, functionName: 'currentDay',
                } as any)) as bigint;
              } catch (e: any) {
                console.error(`[HEX stakes] currentDay failed on ${chainKey}: ${e?.shortMessage ?? e?.message ?? String(e)}`);
              }

              if (Number(hexStakeCount) > 0) {
                // Use Promise.allSettled so a single bad index never aborts the whole batch
                const stakeResults = await Promise.allSettled(
                  Array.from({ length: Number(hexStakeCount) }, (_, i) =>
                    withRetry(() => stakeClient.readContract({
                      address: hexAddr, abi: HEX_ABI, functionName: 'stakeLists',
                      args: [address, BigInt(i)],
                    } as any))
                  )
                );

                stakeResults.forEach((settled, i) => {
                  if (settled.status === 'rejected') {
                    console.warn(`[HEX stakes] index ${i} rejected on ${chainKey}: ${settled.reason?.message ?? settled.reason}`);
                    return;
                  }
                  const stakeResult: any = settled.value;
                  if (!stakeResult) return;

                  let stakeId: any, stakedHearts: any, stakeShares: any,
                      lockedDay: any, stakedDays: any, unlockedDay: any, isAutoStake: any;

                  if (Array.isArray(stakeResult)) {
                    [stakeId, stakedHearts, stakeShares, lockedDay, stakedDays, unlockedDay, isAutoStake] = stakeResult;
                  } else {
                    ({ stakeId, stakedHearts, stakeShares, lockedDay, stakedDays, unlockedDay, isAutoStake } = stakeResult);
                  }

                  if (stakeId === undefined) return;

                  // Always coerce to BigInt - the ABI returns uint72 which viem gives as bigint,
                  // but defensive casting prevents precision loss if a non-bigint sneaks in.
                  const sharesBI     = BigInt(stakeShares  ?? 0);
                  const heartsBI     = BigInt(stakedHearts ?? 0);
                  const lockedDayN   = Number(lockedDay  ?? 0);
                  const stakedDaysN  = Number(stakedDays ?? 0);
                  const currentDayN  = Number(hexCurrentDay);

                  const progress     = Math.min(100, Math.max(0, ((currentDayN - lockedDayN) / Math.max(1, stakedDaysN)) * 100));
                  const daysStakedN  = Math.max(0, currentDayN - lockedDayN);
                  const daysRemaining = Math.max(0, (lockedDayN + stakedDaysN) - currentDayN);

                  // Yield rate: chain-specific HEX per T-Share per day.
                  // BigInt formula: hearts = shares * days * BI_NUM / BI_DEN
                  //   pHEX: 1e12 * 1 * 158 / 1_000_000 = 1.58e8 hearts = 1.58 HEX
                  //   eHEX: 1e12 * 1 * 170 / 1_000_000 = 1.70e8 hearts = 1.70 HEX
                  const yieldBiNum = chainKey === 'pulsechain' ? PHEX_YIELD_BI_NUM : EHEX_YIELD_BI_NUM;
                  const yieldBiDen = chainKey === 'pulsechain' ? PHEX_YIELD_BI_DEN : EHEX_YIELD_BI_DEN;
                  const interestHearts  = (sharesBI * BigInt(daysStakedN) * yieldBiNum) / yieldBiDen;
                  const fullYieldHearts = (sharesBI * BigInt(stakedDaysN) * yieldBiNum) / yieldBiDen;

                  const tShares    = Number(sharesBI) / 1e12;
                  const stakedHex  = Number(heartsBI) / 1e8;
                  const stakeHexYield = Number(fullYieldHearts) / 1e8;

                  const hexPriceChainKey = `${chainKey}:${hexAddr.toLowerCase()}`;
                  const hexChainFallback = chainKey === 'pulsechain' ? fetchedPrices['pulsechain:hex']?.usd : fetchedPrices['hex']?.usd;
                  const hexPrice   = fetchedPrices[hexPriceChainKey]?.usd || hexChainFallback || 0;

                  const valueUsd       = stakedHex * hexPrice;
                  const totalValueUsd  = (Number(heartsBI + fullYieldHearts) / 1e8) * hexPrice;

                  allStakes.push({
                    id: `${chainKey}-${address}-${stakeId}`,
                    stakeId:           Number(stakeId),
                    stakedHearts:      heartsBI,
                    stakeShares:       sharesBI,
                    lockedDay:         lockedDayN,
                    stakedDays:        stakedDaysN,
                    unlockedDay:       Number(unlockedDay ?? 0),
                    isAutoStake:       Boolean(isAutoStake),
                    progress:          Math.round(progress),
                    estimatedValueUsd: valueUsd,
                    interestHearts,
                    totalValueUsd,
                    chain:             chainKey,
                    walletLabel:       wallet.name,
                    walletAddress:     address.toLowerCase(),
                    daysRemaining,
                    tShares,
                    stakedHex,
                    stakeHexYield,
                  });
                });
              }
            } catch (e: any) {
              console.error(`[HEX stakes] Unexpected error on ${chainKey} for ${address.slice(0, 8)}...: ${e?.shortMessage ?? e?.message ?? String(e)}`);
            }
          }
        }));
      }

      // Aggregate HEX stakes into HEX assets for total balance visibility.
      // Only active stakes (daysRemaining > 0) contribute; ended stakes are sitting in the wallet already.
      allStakes.filter(stake => (stake.daysRemaining ?? 0) > 0).forEach(stake => {
        const assetKey = `${stake.chain}-HEX`;
        if (assetMap[assetKey]) {
          const stakedHeartsNum = Number(stake.stakedHearts) / 1e8;
          const interestHeartsNum = Number(stake.interestHearts || 0n) / 1e8;
          const totalHeartsNum = stakedHeartsNum + interestHeartsNum;

          assetMap[assetKey].stakedBalance = (assetMap[assetKey].stakedBalance || 0) + totalHeartsNum;
          assetMap[assetKey].stakedValue = (assetMap[assetKey].stakedValue || 0) + (stake.totalValueUsd || stake.estimatedValueUsd);
        }
      });

      const pulseAssetsMissingPrice = Object.values(assetMap).filter(asset =>
        asset.chain === 'pulsechain'
        && asset.balance > 0
        && asset.price === 0
        && (asset as any).address
        && (asset as any).address !== 'native'
      );

      if (pulseAssetsMissingPrice.length > 0) {
        const fallbackLogos: Record<string, string> = {};

        await Promise.allSettled(pulseAssetsMissingPrice.map(async (asset) => {
          const rawAddress = (asset as any).address?.toLowerCase?.();
          if (!rawAddress) return;

          try {
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${rawAddress}`);
            if (!res.ok) return;

            const data = await res.json();
            const pairs: any[] = (data.pairs || []).filter((pair: any) =>
              pair?.chainId === 'pulsechain'
              && (
                pair?.baseToken?.address?.toLowerCase?.() === rawAddress
                || pair?.quoteToken?.address?.toLowerCase?.() === rawAddress
              )
            );
            if (pairs.length === 0) return;

            const bestPair = [...pairs].sort((a, b) =>
              Number(b?.liquidity?.usd ?? 0) - Number(a?.liquidity?.usd ?? 0)
            )[0];

            const matchedBase = bestPair?.baseToken?.address?.toLowerCase?.() === rawAddress;
            const pairToken = matchedBase ? bestPair?.baseToken : bestPair?.quoteToken;
            const price = Number(bestPair?.priceUsd ?? 0);
            if (!(price > 0)) return;

            assetMap[asset.id] = {
              ...assetMap[asset.id],
              symbol: pairToken?.symbol || assetMap[asset.id].symbol,
              name: pairToken?.name || assetMap[asset.id].name,
              price,
              value: assetMap[asset.id].balance * price,
              priceChange24h: Number(bestPair?.priceChange?.h24 ?? assetMap[asset.id].priceChange24h ?? 0),
              priceChange1h: Number(bestPair?.priceChange?.h1 ?? assetMap[asset.id].priceChange1h ?? 0),
              pnl24h: Number(bestPair?.priceChange?.h24 ?? assetMap[asset.id].pnl24h ?? 0),
            };

            if (bestPair?.info?.imageUrl) {
              fallbackLogos[rawAddress] = bestPair.info.imageUrl;
              (assetMap[asset.id] as any).logoUrl = bestPair.info.imageUrl;
            }

            Object.values(walletAssetMap).forEach(walletMap => {
              const walletAsset = walletMap[asset.id];
              if (!walletAsset) return;

              walletMap[asset.id] = {
                ...walletAsset,
                symbol: pairToken?.symbol || walletAsset.symbol,
                name: pairToken?.name || walletAsset.name,
                price,
                value: walletAsset.balance * price,
                priceChange24h: Number(bestPair?.priceChange?.h24 ?? walletAsset.priceChange24h ?? 0),
                priceChange1h: Number(bestPair?.priceChange?.h1 ?? walletAsset.priceChange1h ?? 0),
                pnl24h: Number(bestPair?.priceChange?.h24 ?? walletAsset.pnl24h ?? 0),
                ...(bestPair?.info?.imageUrl ? { logoUrl: bestPair.info.imageUrl } : {}),
              } as any;
            });
          } catch {
            /* ignore */
          }
        }));

        if (Object.keys(fallbackLogos).length > 0) {
          setTokenLogos(prev => ({ ...prev, ...fallbackLogos }));
        }
      }

      // Auto-clear tokens from spamTokenIds if they now have a real price
      const pricedIds = Object.values(assetMap).filter(a => a.price > 0).map(a => a.id);
      if (pricedIds.length > 0) {
        setSpamTokenIds(prev => prev.filter(id => !pricedIds.includes(id)));
      }

      // Merge WPLS balance/value into the PLS entry (same economic asset on PulseChain).
      // The inline merge during balance fetching handles the common case; this pass catches
      // any residual standalone WPLS entry that might appear if the inline path was skipped.
      const wplsEntry = assetMap['pulsechain-WPLS'];
      if (wplsEntry) {
        const plsEntry = assetMap['pulsechain-PLS'];
        if (plsEntry) {
          plsEntry.balance += wplsEntry.balance;
          plsEntry.value   += wplsEntry.value;
        } else {
          // No native PLS entry at all - promote WPLS to a PLS row
          assetMap['pulsechain-PLS'] = { ...wplsEntry, id: 'pulsechain-PLS', symbol: 'PLS' };
        }
        delete assetMap['pulsechain-WPLS'];
      }

      setRealAssets(Object.values(assetMap).sort((a, b) => b.value - a.value));
      setRealStakes(prev => {
        if (allStakes.length > 0) return allStakes;
        if (wallets.length === 0) return allStakes;
        const walletSet = new Set(wallets.map(w => w.address.toLowerCase()));
        const cachedForCurrentWallets = prev.filter(stake => walletSet.has((stake.walletAddress || '').toLowerCase()));
        return cachedForCurrentWallets.length > 0 ? cachedForCurrentWallets : allStakes;
      });

      // Build per-wallet asset arrays
      const newWalletAssets: Record<string, Asset[]> = {};
      Object.entries(walletAssetMap).forEach(([addr, map]) => {
        newWalletAssets[addr] = Object.values(map).sort((a, b) => b.value - a.value);
      });
      setWalletAssets(newWalletAssets);

      // -- LP Position Tracking ----------------------------------------------
      // Fetch LP token balances, reserves, and totalSupply for tracked PulseX pairs
      try {
        const pcRpc = CHAINS.pulsechain.rpc;
        const walletAddrs = wallets.map(w => w.address.toLowerCase());
        const LP_PAIR_META: Record<string, { name: string; token0: string; token0Sym: string; token0Dec: number; token1: string; token1Sym: string; token1Dec: number }> = {
          '0x1b45b9148791d3a104184cd5dfe5ce57193a3ee9': { name: 'PLSX/WPLS', token0: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', token0Sym: 'PLSX', token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa': { name: 'INC/WPLS',  token0: '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d', token0Sym: 'INC',  token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xf1f4ee610b2babb05c635f726ef8b0c568c8dc65': { name: 'pHEX/WPLS', token0: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', token0Sym: 'HEX',  token0Dec: 8,  token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0x42abdfdb63f3282033c766e72cc4810738571609': { name: 'WETH/WPLS', token0: '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c', token0Sym: 'WETH', token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xdb82b0919584124a0eb176ab136a0cc9f148b2d1': { name: 'WPLS/WBTC', token0: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token0Sym: 'WPLS', token0Dec: 18, token1: '0xb17d901469b9208b17d916112988a3fed19b5ca1', token1Sym: 'WBTC', token1Dec: 8  },
          '0xe56043671df55de5cdf8459710433c10324de0ae': { name: 'WPLS/DAI',  token0: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token0Sym: 'WPLS', token0Dec: 18, token1: '0xefd766ccb38eaf1dfd701853bfce31359239f305', token1Sym: 'DAI',  token1Dec: 18 },
          '0x6753560538eca67617a9ce605178f788be7e524e': { name: 'USDC/WPLS', token0: '0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07', token0Sym: 'USDC', token0Dec: 6,  token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0x322df7921f28f1146cdf62afdac0d6bc0ab80711': { name: 'USDT/WPLS', token0: '0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f', token0Sym: 'USDT', token0Dec: 6,  token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
        };
        const lpAddrs = Object.keys(LP_PAIR_META);

        // Selectors
        const SEL_RESERVES   = '0x0902f1ac'; // getReserves()
        const SEL_TOTAL_SUP  = '0x18160ddd'; // totalSupply()
        const SEL_BAL_OF     = '0x70a08231'; // balanceOf(address)
        const padAddr = (a: string) => '000000000000000000000000' + a.replace('0x', '').toLowerCase();

        // Build batch: for each LP pair: getReserves + totalSupply + balanceOf(wallet)*n
        const lpBatch: any[] = [];
        let batchId = 0;
        const lpBatchMeta: { pairAddr: string; type: 'reserves' | 'supply' | 'balance'; walletAddr?: string; id: number }[] = [];

        lpAddrs.forEach(pairAddr => {
          lpBatch.push({ jsonrpc: '2.0', id: batchId, method: 'eth_call', params: [{ to: pairAddr, data: SEL_RESERVES }, 'latest'] });
          lpBatchMeta.push({ pairAddr, type: 'reserves', id: batchId++ });
          lpBatch.push({ jsonrpc: '2.0', id: batchId, method: 'eth_call', params: [{ to: pairAddr, data: SEL_TOTAL_SUP }, 'latest'] });
          lpBatchMeta.push({ pairAddr, type: 'supply', id: batchId++ });
          walletAddrs.forEach(wa => {
            lpBatch.push({ jsonrpc: '2.0', id: batchId, method: 'eth_call', params: [{ to: pairAddr, data: SEL_BAL_OF + padAddr(wa) }, 'latest'] });
            lpBatchMeta.push({ pairAddr, type: 'balance', walletAddr: wa, id: batchId++ });
          });
        });

        if (lpBatch.length > 0) {
          const lpRes = await fetch(pcRpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lpBatch) });
          const lpResults: any[] = await lpRes.json();
          lpResults.sort((a, b) => a.id - b.id);

          const lpData: Record<string, { reserve0: bigint; reserve1: bigint; totalSupply: bigint; balances: Record<string, bigint> }> = {};
          lpAddrs.forEach(a => { lpData[a] = { reserve0: 0n, reserve1: 0n, totalSupply: 0n, balances: {} }; });

          lpResults.forEach(r => {
            const meta = lpBatchMeta[r.id];
            if (!meta || !r.result || r.result === '0x') return;
            const hex = r.result.replace('0x', '').padStart(192, '0');
            if (meta.type === 'reserves') {
              lpData[meta.pairAddr].reserve0 = BigInt('0x' + hex.slice(0, 64));
              lpData[meta.pairAddr].reserve1 = BigInt('0x' + hex.slice(64, 128));
            } else if (meta.type === 'supply') {
              lpData[meta.pairAddr].totalSupply = BigInt('0x' + r.result.replace('0x', '').padStart(64, '0'));
            } else if (meta.type === 'balance' && meta.walletAddr) {
              lpData[meta.pairAddr].balances[meta.walletAddr] = BigInt('0x' + r.result.replace('0x', '').padStart(64, '0'));
            }
          });

          const wplsUSD = fetchedPrices['pulsechain']?.usd || fetchedPrices['pulsechain:native']?.usd || 0;
          const newLpPositions: LpPosition[] = [];

          lpAddrs.forEach(pairAddr => {
            const d = lpData[pairAddr];
            const meta = LP_PAIR_META[pairAddr];
            if (!d || d.totalSupply === 0n) return;

            const totalUserBal = walletAddrs.reduce((acc, wa) => acc + (d.balances[wa] ?? 0n), 0n);
            if (totalUserBal === 0n) return;

            const userShare = (totalUserBal * BigInt(1e18)) / d.totalSupply;
            const tok0Raw = (d.reserve0 * userShare) / BigInt(1e18);
            const tok1Raw = (d.reserve1 * userShare) / BigInt(1e18);
            const tok0Amount = Number(tok0Raw) / Math.pow(10, meta.token0Dec);
            const tok1Amount = Number(tok1Raw) / Math.pow(10, meta.token1Dec);

            const tok0PriceKey = `pulsechain:${meta.token0}`;
            const tok1PriceKey = `pulsechain:${meta.token1}`;
            const tok0Usd = tok0Amount * (fetchedPrices[tok0PriceKey]?.usd || fetchedPrices[meta.token0]?.usd || (meta.token0Sym === 'WPLS' ? wplsUSD : 0));
            const tok1Usd = tok1Amount * (fetchedPrices[tok1PriceKey]?.usd || fetchedPrices[meta.token1]?.usd || (meta.token1Sym === 'WPLS' ? wplsUSD : 0));

            newLpPositions.push({
              pairAddress: pairAddr,
              pairName: meta.name,
              token0Address: meta.token0,
              token1Address: meta.token1,
              token0Symbol: meta.token0Sym,
              token1Symbol: meta.token1Sym,
              token0Decimals: meta.token0Dec,
              token1Decimals: meta.token1Dec,
              token0Amount: tok0Amount,
              token1Amount: tok1Amount,
              token0Usd: tok0Usd,
              token1Usd: tok1Usd,
              totalUsd: tok0Usd + tok1Usd,
              lpBalance: Number(totalUserBal) / 1e18
            });
          });

          setLpPositions(newLpPositions.sort((a, b) => b.totalUsd - a.totalUsd));
        }
      } catch (e) {
        console.warn('LP position fetch failed:', e);
      }

      // -- Farm Position Tracking (MasterChef / INC Rewards) -----------------
      try {
        const pcRpc = CHAINS.pulsechain.rpc;
        const MASTERCHEF = '0xb2ca4a66d3e57a5a9a12043b6bad28249fe302d4';
        const walletAddrs = wallets.map(w => w.address.toLowerCase());

        // Get pool count
        const poolLenRes = await fetch(pcRpc, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'eth_call', params: [{ to: MASTERCHEF, data: '0x081e3eda' }, 'latest'] })
        });
        const poolLenData = await poolLenRes.json();
        const poolLength = parseInt(poolLenData.result, 16);
        if (!poolLength || poolLength === 0) throw new Error('No pools');

        const SEL_POOL_INFO = '0x1526fe27';
        const SEL_USER_INFO = '0x93f1a40b';
        const SEL_PENDING   = '0xf40f0f52';
        const padN = (n: number) => n.toString(16).padStart(64, '0');
        const padA = (a: string) => '000000000000000000000000' + a.replace('0x', '').toLowerCase();

        // Batch: poolInfo for each pool + userInfo + pendingInc for each wallet/pool
        const farmBatch: any[] = [];
        let fId = 0;
        type FarmMeta = { type: 'pool'; poolIdx: number; id: number } | { type: 'user' | 'pending'; poolIdx: number; wallet: string; id: number };
        const farmMeta: FarmMeta[] = [];

        for (let p = 0; p < poolLength; p++) {
          farmBatch.push({ jsonrpc: '2.0', id: fId, method: 'eth_call', params: [{ to: MASTERCHEF, data: SEL_POOL_INFO + padN(p) }, 'latest'] });
          farmMeta.push({ type: 'pool', poolIdx: p, id: fId++ });
          walletAddrs.forEach(wa => {
            farmBatch.push({ jsonrpc: '2.0', id: fId, method: 'eth_call', params: [{ to: MASTERCHEF, data: SEL_USER_INFO + padN(p) + padA(wa) }, 'latest'] });
            farmMeta.push({ type: 'user', poolIdx: p, wallet: wa, id: fId++ });
            farmBatch.push({ jsonrpc: '2.0', id: fId, method: 'eth_call', params: [{ to: MASTERCHEF, data: SEL_PENDING + padN(p) + padA(wa) }, 'latest'] });
            farmMeta.push({ type: 'pending', poolIdx: p, wallet: wa, id: fId++ });
          });
        }

        // Split into batches of 50 to avoid RPC limits
        const CHUNK = 50;
        const farmResults: any[] = [];
        for (let i = 0; i < farmBatch.length; i += CHUNK) {
          const chunk = farmBatch.slice(i, i + CHUNK);
          const r = await fetch(pcRpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chunk) });
          const d: any[] = await r.json();
          farmResults.push(...d);
        }
        farmResults.sort((a, b) => a.id - b.id);

        const poolLpAddresses: Record<number, string> = {};
        const userStaked: Record<number, Record<string, bigint>> = {};
        const userPending: Record<number, Record<string, bigint>> = {};

        farmResults.forEach(r => {
          const meta = farmMeta[r.id];
          if (!meta || !r.result || r.result === '0x') return;
          const hex = r.result.replace('0x', '');
          if (meta.type === 'pool') {
            // poolInfo returns: lpToken(address), allocPoint, lastRewardTime, accIncPerShare
            const lpAddr = '0x' + hex.slice(24, 64);
            poolLpAddresses[meta.poolIdx] = lpAddr.toLowerCase();
          } else if (meta.type === 'user') {
            if (!userStaked[meta.poolIdx]) userStaked[meta.poolIdx] = {};
            userStaked[meta.poolIdx][meta.wallet] = BigInt('0x' + hex.slice(0, 64));
          } else if (meta.type === 'pending') {
            if (!userPending[meta.poolIdx]) userPending[meta.poolIdx] = {};
            userPending[meta.poolIdx][meta.wallet] = BigInt('0x' + hex.slice(0, 64));
          }
        });

        const incPriceUsd = fetchedPrices['pulsechain:0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d']?.usd || 0;
        const wplsUSD = fetchedPrices['pulsechain']?.usd || 0;
        const LP_PAIR_META_FARM: Record<string, { name: string; token0: string; token0Sym: string; token0Dec: number; token1: string; token1Sym: string; token1Dec: number }> = {
          '0x1b45b9148791d3a104184cd5dfe5ce57193a3ee9': { name: 'PLSX/WPLS', token0: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', token0Sym: 'PLSX', token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa': { name: 'INC/WPLS',  token0: '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d', token0Sym: 'INC',  token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xf1f4ee610b2babb05c635f726ef8b0c568c8dc65': { name: 'pHEX/WPLS', token0: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', token0Sym: 'HEX',  token0Dec: 8,  token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0x42abdfdb63f3282033c766e72cc4810738571609': { name: 'WETH/WPLS', token0: '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c', token0Sym: 'WETH', token0Dec: 18, token1: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token1Sym: 'WPLS', token1Dec: 18 },
          '0xdb82b0919584124a0eb176ab136a0cc9f148b2d1': { name: 'WPLS/WBTC', token0: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', token0Sym: 'WPLS', token0Dec: 18, token1: '0xb17d901469b9208b17d916112988a3fed19b5ca1', token1Sym: 'WBTC', token1Dec: 8  },
        };

        const newFarmPositions: FarmPosition[] = [];
        Object.entries(poolLpAddresses).forEach(([poolIdxStr, lpAddr]) => {
          const poolIdx = Number(poolIdxStr);
          const pairMeta = LP_PAIR_META_FARM[lpAddr];
          if (!pairMeta) return;

          const totalStaked = walletAddrs.reduce((acc, wa) => acc + (userStaked[poolIdx]?.[wa] ?? 0n), 0n);
          const totalPending = walletAddrs.reduce((acc, wa) => acc + (userPending[poolIdx]?.[wa] ?? 0n), 0n);
          if (totalStaked === 0n) return;

          const stakedLp = Number(totalStaked) / 1e18;
          const pendingInc = Number(totalPending) / 1e18;
          const pendingIncUsd = pendingInc * incPriceUsd;

          const tok0PriceKey = `pulsechain:${pairMeta.token0}`;
          const tok1PriceKey = `pulsechain:${pairMeta.token1}`;
          const tok0Usd = fetchedPrices[tok0PriceKey]?.usd || (pairMeta.token0Sym === 'WPLS' ? wplsUSD : 0);
          const tok1Usd = fetchedPrices[tok1PriceKey]?.usd || (pairMeta.token1Sym === 'WPLS' ? wplsUSD : 0);
          // Estimate token amounts from staked LP (simplified: assume 50/50 split by value)
          const totalLpUsd = stakedLp * 2 * Math.min(tok0Usd, tok1Usd || tok0Usd); // rough estimate

          newFarmPositions.push({
            poolId: poolIdx,
            lpAddress: lpAddr,
            pairName: pairMeta.name,
            token0Symbol: pairMeta.token0Sym,
            token1Symbol: pairMeta.token1Sym,
            token0Address: pairMeta.token0,
            token1Address: pairMeta.token1,
            stakedLp,
            token0Amount: 0,
            token1Amount: 0,
            token0Usd: 0,
            token1Usd: 0,
            totalUsd: totalLpUsd,
            pendingInc,
            pendingIncUsd
          });
        });

        setFarmPositions(newFarmPositions.sort((a, b) => b.totalUsd - a.totalUsd));
      } catch (e) {
        console.warn('Farm position fetch failed:', e);
      }

      // Normalize raw transactions: group by hash, collapse in+out pairs into swaps.
      // Enriches with historic prices before normalization.
      const walletAddrs = new Set<string>(wallets.map(w => w.address.toLowerCase()));
      const processedTransactions = await normalizeTransactions(allTransactions, walletAddrs);

      setTransactions(processedTransactions);
      setLastUpdated(Date.now());

      // Save a history point
      const totalValue = Object.values(assetMap).reduce((acc, curr) => acc + curr.value, 0);
      const plsPrice = fetchedPrices['pulsechain']?.usd || 0.00005;
      const nativeValue = totalValue / plsPrice;

      // Calculate chain-specific PNL for the history point
      const chainPnl: Record<Chain, number> = { pulsechain: 0, ethereum: 0, base: 0, arbitrum: 0 };
      Object.values(assetMap).forEach(asset => {
        chainPnl[asset.chain] += (asset.value * (asset.pnl24h || 0) / 100);
      });

      setHistory(prev => {
        const lastPoint = prev[prev.length - 1];
        const pnl = lastPoint ? totalValue - lastPoint.value : 0;
        const newPoint: HistoryPoint = {
          timestamp: Date.now(),
          value: totalValue,
          nativeValue: nativeValue,
          pnl: pnl,
          chainPnl: chainPnl
        };
        return [...prev.slice(-99), newPoint];
      });

    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [wallets, prices, setRealAssets, setRealStakes, setLpPositions, setFarmPositions, setTransactions, setPrices, setTokenLogos, setHistory, setIsLoading, setWalletAssets]);
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
