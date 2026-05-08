/**
 * CENTRALIZED APPLICATION CONSTANTS
 *
 * This file serves as the single source of truth for all hardcoded constants,
 * magic numbers, API endpoints, colors, timing values, and configuration across
 * the entire application. All constants are grouped logically by category.
 *
 * Update this file to change app-wide behavior. Never hardcode values elsewhere.
 */

// ============================================================================
// CHAIN & NETWORK CONFIGURATION
// ============================================================================

export const CHAIN_COLORS: Record<string, string> = {
  pulsechain: '#f739ff',
  ethereum: '#627EEA',
  base: '#0052FF',
} as const;

export const CHAIN_LABELS: Record<string, string> = {
  pulsechain: 'PulseChain',
  ethereum: 'Ethereum',
  base: 'Base',
} as const;

// ============================================================================
// TOKEN ADDRESSES & CONTRACT CONFIGURATION
// ============================================================================

/** Wrapped PLS address (ERC20 wrapper for native PLS) */
export const WPLS_ADDRESS = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';

/** pHEX - HEX staking token on PulseChain */
export const PHEX_ADDRESS = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';

/** eHEX - Bridged Ethereum HEX on PulseChain */
export const EHEX_PULSECHAIN_ADDR = '0x57fde0a71132198bbec939b98976993d8d89d225';

/** ETH HEX - HEX address on Ethereum (also used for pHEX pricing) */
export const ETH_HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';

/** Bridge token addresses for LiquidityX bridge page */
export const BRIDGE_TOKENS = [
  { symbol: 'pWETH', name: 'Wrapped Ether',  address: '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c', decimals: 18, coingeckoId: 'ethereum', color: '#627EEA' },
  { symbol: 'pDAI',  name: 'DAI Stablecoin', address: '0xefd766ccb38eaf1dfd701853bfce31359239f305', decimals: 18, coingeckoId: 'dai',      color: '#f5a623' },
  { symbol: 'pUSDC', name: 'USD Coin',        address: '0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07', decimals: 6,  coingeckoId: 'usd-coin', color: '#2775ca' },
  { symbol: 'pUSDT', name: 'Tether USD',      address: '0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f', decimals: 6,  coingeckoId: 'tether',   color: '#26a17b' },
  { symbol: 'pWBTC', name: 'Wrapped Bitcoin', address: '0xb17d901469b9208b17d916112988a3fed19b5ca1', decimals: 8,  coingeckoId: 'bitcoin',  color: '#f7931a' },
  { symbol: 'eHEX',  name: 'HEX (bridged)',   address: '0x57fde0a71132198bbec939b98976993d8d89d225', decimals: 8,  coingeckoId: 'hex',      color: '#ff00ff' },
] as const;

/** Core PulseChain ecosystem tokens */
export const PULSECHAIN_CORE_TOKENS = [
  { symbol: 'PLS', role: 'Native gas', contract: 'native', note: 'Pays PulseChain transaction fees.', color: 'var(--accent)' },
  { symbol: 'WPLS', role: 'Wrapped PLS', contract: '0xa1077a294dde1b09bb078844df40758a5d0f9a27', note: 'ERC20-style PLS for DeFi pools.', color: '#06b6d4' },
  { symbol: 'PLSX', role: 'PulseX token', contract: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', note: 'PulseX DEX token with buy-and-burn mechanics.', color: '#f739ff' },
  { symbol: 'INC', role: 'Farm incentive', contract: '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d', note: 'Earned by PulseX liquidity farmers.', color: '#22d3ee' },
  { symbol: 'pHEX', role: 'HEX on PulseChain', contract: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', note: 'Fork-copy HEX that can be staked on PulseChain.', color: '#a855f7' },
] as const;

// ============================================================================
// PORTFOLIO & ASSET THRESHOLDS
// ============================================================================

/** Minimum investment amount to create a portfolio entry and show in holdings list */
export const MIN_INVESTMENT_THRESHOLD = 100;

/** Minimum USD value to display an asset (filter out dust holdings) */
export const DUST_THRESHOLD = 10;

/** Minimum balance display threshold for token table */
export const MIN_DISPLAY_BALANCE = 0.0001;

/** Minimum WPLS reserve for token filtering (raw units, not normalized) */
export const MIN_WPLS_RESERVE = 10_000_000;

// ============================================================================
// CORE TOKENS & MARKET WATCH
// ============================================================================

/** Featured tokens for the market watch widget and price cards */
export const CORE_TOKENS = [
  { id: 'PLS',  symbol: 'PLS',  name: 'PulseChain',    priceKey: 'pulsechain',                                                    changeKey: 'pulsechain:native', accent: 'linear-gradient(90deg,#00ff9f,#00cfff)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27.png' },
  { id: 'PLSX', symbol: 'PLSX', name: 'PulseX',        priceKey: 'pulsechain:0x95b303987a60c71504d99aa1b13b4da07b0790ab',            accent: 'linear-gradient(90deg,#ff00bf,#7b00ff)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x95B303987A60C71504D99Aa1b13B4DA07b0790ab.png' },
  { id: 'INC',  symbol: 'INC',  name: 'Incentive',     priceKey: 'pulsechain:0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d',            accent: 'linear-gradient(90deg,#39ff14,#00ff9f)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d.png' },
  { id: 'HEX',  symbol: 'HEX',  name: 'pHEX',          priceKey: 'pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',            accent: 'linear-gradient(90deg,#ff6b35,#f7931a)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39.png' },
  { id: 'PRVX', symbol: 'PRVX', name: 'PrivacyX',      priceKey: 'pulsechain:0xf6f8db0aba00007681f8faf16a0fda1c9b030b11',            accent: 'linear-gradient(90deg,#6c3ce1,#b044ff)',                                              logo: 'https://cdn.dexscreener.com/cms/images/ODHYYN7yppDHnd6u?width=64&height=64&fit=crop&quality=95&format=auto' },
  { id: 'eHEX', symbol: 'eHEX', name: 'Ethereum HEX',  priceKey: 'ethereum:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',              accent: 'linear-gradient(90deg,#ff0080,#ff6b35,#ffeb3b,#00ff9f,#00cfff,#7b00ff)',             logo: 'https://cdn.dexscreener.com/cms/images/a46bd12940d8501c2aacdd10ad4780e818bdedaba1ec8eb46b52e4d8313d4a93?width=64&height=64&fit=crop&quality=95&format=auto' },
] as const;

// ============================================================================
// UI COLORS & STYLING
// ============================================================================

/** Colors for wallet indicator dots (portfolio asset distribution visualization) */
export const WALLET_DOT_COLORS = ['#00FF9F','#f739ff','#627EEA','#f97316','#a855f7','#f59e0b','#06b6d4','#ec4899'] as const;

/** Primary accent colors used throughout the app */
export const COLOR_SCHEME = {
  pulseChainAccent: '#f739ff',
  ethereumAccent: '#627EEA',
  baseAccent: '#0052FF',
  positive: 'var(--positive)', // green in light, green in dark
  negative: 'var(--negative)', // red in light, red in dark
  defiColor: 'rgba(247,57,255,0.9)',
  defiDim: 'rgba(247,57,255,0.08)',
  defiLine: '#f739ff',
  hyperlinkBlue: '#627EEA',
  privacyPurple: '#a855f7',
  teaBlue: '#22d3ee',
  cyanGlad: '#06b6d4',
} as const;

// ============================================================================
// API & EXTERNAL SERVICES
// ============================================================================

export const API_ENDPOINTS = {
  DEXSCREENER: 'https://api.dexscreener.com',
  DEXSCREENER_V1_TOKENS: 'https://api.dexscreener.com/tokens/v1',
  DEXSCREENER_LATEST: 'https://api.dexscreener.com/latest/dex',
  DEXSCREENER_SEARCH: 'https://api.dexscreener.com/latest/dex/search',
  DEXSCREENER_WATCHLIST_V1: 'https://api.dexscreener.com/watchlist/v1/share',
  DEXSCREENER_WATCHLIST_V2: 'https://api.dexscreener.com/watchlist/v2/share',
  COINGECKO: 'https://api.coingecko.com/api/v3',
  COINGECKO_PRICE: 'https://api.coingecko.com/api/v3/simple/price',
  COINGECKO_MARKETS: 'https://api.coingecko.com/api/v3/coins/markets',
  PULSECHAIN_SCANNER: 'https://api.scan.pulsechain.com/api',
  PULSECHAIN_SCANNER_V2: 'https://api.scan.pulsechain.com/api/v2',
  ETHERSCAN: 'https://api.etherscan.io/v2/api',
} as const;

/** RPC endpoints for blockchain queries - primary and fallback */
export const RPC_ENDPOINTS = {
  PULSECHAIN_PRIMARY: 'https://rpc-pulsechain.g4mm4.io',
  PULSECHAIN_FALLBACK: 'https://rpc.pulsechain.com',
  ETHEREUM_PRIMARY: 'https://cloudflare-eth.com',
  ETHEREUM_FALLBACK: 'https://eth.llamarpc.com',
} as const;

// ============================================================================
// API REQUEST TIMEOUTS
// ============================================================================

export const API_TIMEOUTS = {
  DEXSCREENER: 5000,           // 5 seconds
  COINGECKO: 5000,             // 5 seconds
  RPC: 3000,                   // 3 seconds
  BLOCKSCOUT: 15000,           // 15 seconds (longer for blockchain queries)
  GENERAL_FETCH: 5000,         // 5 seconds default
} as const;

// ============================================================================
// UI TIMING & ANIMATIONS
// ============================================================================

export const ANIMATION_DURATIONS = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/** Debounce delays for user input and scroll events */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,         // Delay before searching token list
  INPUT: 500,          // Delay for general input changes
  SCROLL: 200,         // Delay for scroll event processing
  RESIZE: 250,         // Delay for window resize
  LOCAL_STORAGE: 500,  // Delay for persisting state to localStorage
} as const;

/** Cache TTL (time-to-live) for various data sources */
export const CACHE_TTL = {
  MARKET_DATA: 5 * 60 * 1000,        // 5 minutes
  TOKEN_INFO: 1 * 60 * 60 * 1000,    // 1 hour
  HEX_DAILY_DATA: 60 * 60 * 1000,    // 1 hour
  BLOCK_DATA: 30 * 1000,              // 30 seconds
} as const;

/** Copy-to-clipboard notification timeout */
export const TOAST_DURATIONS = {
  COPY_FEEDBACK: 1500,  // Copied! feedback duration (ms)
} as const;

// ============================================================================
// TRANSACTION & DATA POLLING
// ============================================================================

/** Time window for transaction filtering and analytics */
export const TIME_WINDOWS = {
  HOURS_24: 24 * 60 * 60 * 1000,      // 24 hours
  HOURS_12: 12 * 60 * 60 * 1000,      // 12 hours (bridge window)
  HOURS_1: 60 * 60 * 1000,            // 1 hour
  MINUTES_1: 60 * 1000,               // 1 minute
} as const;

/** Data fetch and retry configuration */
export const FETCH_CONFIG = {
  RETRY_COUNT: 5,                     // Number of retry attempts
  RETRY_DELAY: 1000,                  // Initial delay between retries (ms)
  RETRY_BACKOFF: 1500,                // Exponential backoff multiplier
  MAX_RETRIES_BACKOFF: 1500,          // Max backoff delay between retries
  PAGE_SIZE: 10000,                   // Records per API page
  LOCAL_STORAGE_CACHE_SIZE: 200,      // Max transactions to cache
  MARKET_DATA_REFRESH: 30000,         // Refresh market data every 30 seconds
} as const;

// ============================================================================
// FORM & INPUT VALIDATION
// ============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_WALLET_NAME_LENGTH: 50,
  MAX_CUSTOM_COIN_SYMBOLS: 50,
  SWAP_PRESETS: [10, 25, 50, 100] as const,
} as const;

// ============================================================================
// HEX PRICE DEFAULTS & FALLBACKS
// ============================================================================

/** Default prices when API is unavailable */
export const DEFAULT_PRICES = {
  PLS: 0.00005,        // PulseChain fallback
  ETH: 3400,           // Ethereum fallback
} as const;

// ============================================================================
// SMART CONTRACT & SWAP CONFIGURATION
// ============================================================================

/** Liberty Swap (cross-chain bridge) router contracts */
export const LIBERTY_SWAP_ROUTERS: Record<string, string> = {
  base: '0xcf3d89aedd07ee94e5c45037581744e2d9f0b9fc',
} as const;

/** Function selector for Liberty Swap detection */
export const LIBERTY_SWAP_SELECTOR = 'dc655e26';

// ============================================================================
// STATIC ASSET LOGOS
// ============================================================================

/**
 * Curated logo overrides keyed by lowercase contract address on PulseChain.
 * These entries are permanent and cannot be overwritten by fetched data.
 */
export const STATIC_LOGOS: Record<string, string> = {
  '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d': 'https://tokens.app.pulsex.com/images/tokens/0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d.png', // INC
  '0xf6f8db0aba00007681f8faf16a0fda1c9b030b11': 'https://cdn.dexscreener.com/cms/images/ODHYYN7yppDHnd6u?width=64&height=64&fit=crop&quality=95&format=auto', // PRVX
  '0xe33a5ae21f93acec5cfc0b7b0fdbb65a0f0be5cc': 'https://tokens.app.pulsex.com/images/tokens/0xE33A5AE21F93aceC5CfC0b7b0FDBB65A0f0Be5cC.png', // MOST
  '0xefd766ccb38eaf1dfd701853bfce31359239f305': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png', // pDAI (bridged DAI)
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'https://tokens.app.pulsex.com/images/tokens/0x6B175474E89094C44Da98b954EedeAC495271d0F.png', // pDAI system copy
} as const;

// ============================================================================
// SMART CONTRACT ABI
// ============================================================================

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
] as const;

// ============================================================================
// APPLICATION NAVIGATION
// ============================================================================

export type ActiveTab = 'home' | 'overview' | 'assets' | 'stakes' | 'history' | 'tracker' | 'wallets' | 'holdings' | 'defi' | 'pulsechain-official' | 'pulsechain-community' | 'bridge' | 'wallet-analyzer';

export const ACTIVE_TABS: ActiveTab[] = ['home', 'overview', 'assets', 'stakes', 'history', 'tracker', 'wallets', 'holdings', 'defi', 'pulsechain-official', 'pulsechain-community', 'bridge', 'wallet-analyzer'];

export const ACTIVE_TAB_STORAGE_KEY = 'pulseport_active_tab';
