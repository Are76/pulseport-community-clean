import type React from 'react';

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/** Supported blockchain networks. */
export type Chain = 'pulsechain' | 'ethereum' | 'base' | 'arbitrum';

/** Wallet address type (lowercase). */
export type Address = string & { readonly __brand: 'Address' };

/** Helper to create branded Address type. */
export const brandAddress = (addr: string): Address => addr.toLowerCase() as Address;

/** Percentage type (0-100). */
export type Percentage = number & { readonly __brand: 'Percentage' };

/** Portfolio holder/account information. */
export interface Wallet {
  address: string;
  name: string;
}

/** Asset holdings with pricing and performance data. */
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  address?: string;
  balance: number;
  stakedBalance?: number;
  price: number;
  value: number;
  stakedValue?: number;
  chain: Chain;
  logoUrl?: string;
  pnl24h?: number;
  priceChange24h?: number;
  priceChange1h?: number;
  priceChange7d?: number;
  priceChange6h?: number;
  isCore?: boolean;
  isBridged?: boolean;
  entryPls?: number;
  isSpam?: boolean;
}

/** Asset with guaranteed address field (token contract). */
export interface AssetWithAddress extends Asset {
  address: string;
}

/** Type guard to check if asset has an address. */
export const isAssetWithAddress = (asset: Asset): asset is AssetWithAddress => {
  return !!asset.address;
};

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
  address?: string;
  logoUrl?: string;
  amount: number;
  currentPrice: number;
  priceChange24h?: number;
  currentValue: number;
  costBasis: number;
  pnlUsd: number;
  pnlPercent: number;
  sourceMix: InvestmentSourceAttribution[];
  routeSummary: string;
  thenValue: number;
  nowValue: number;
}

export interface HexStake {
  id: string;
  stakeId: number;
  stakedHearts: bigint;
  stakeShares: bigint;
  lockedDay: number;
  stakedDays: number;
  unlockedDay: number;
  isAutoStake: boolean;
  progress: number; // 0 to 100
  estimatedValueUsd: number;
  interestHearts?: bigint;
  totalValueUsd?: number;
  chain: 'pulsechain' | 'ethereum';
  walletLabel?: string;
  walletAddress?: string;
  daysRemaining?: number;
  tShares?: number;
  stakedHex?: number;
  stakeHexYield?: number;
}

export interface LpPosition {
  pairAddress: string;
  pairName: string;
  token0Address: string;
  token1Address: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  token0Amount: number;
  token1Amount: number;
  token0Usd: number;
  token1Usd: number;
  totalUsd: number;
  lpBalance: number;
}

export interface FarmPosition {
  poolId: number;
  lpAddress: string;
  pairName: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  stakedLp: number;
  token0Amount: number;
  token1Amount: number;
  token0Usd: number;
  token1Usd: number;
  totalUsd: number;
  pendingInc: number;
  pendingIncUsd: number;
}

export interface LpPositionEnriched extends LpPosition {
  totalSupply: number;
  ownershipPct: number;
  reserve0: number;
  reserve1: number;
  token0PriceUsd: number;
  token1PriceUsd: number;
  ilEstimate: number | null;      // result of IL formula x 100 for %, null if no entry
  fees24hUsd: number | null;
  volume24hUsd: number | null;
  isStaked: boolean;
  poolId?: number;
  pendingIncUsd?: number;
  walletLpBalance: number;   // LP tokens held in wallet (normalised to 1e18)
  stakedLpBalance: number;   // LP tokens staked in MasterChef (normalised to 1e18)
  sparkline: { t: number; v: number }[];  // 7 points, approximate - totalUsd � small variance
}

export interface PortfolioSummary {
  totalValue: number;
  liquidValue: number;
  stakingValueUsd: number;
  pnl24h: number;
  pnl24hPercent: number;
  chainDistribution: Record<Chain, number>;
  nativeValue: number;
  nativePlsBalance?: number;
  stakedPlsValue?: number;
  tokenPlsValue?: number;
  netInvestment: number;
  unifiedPnl: number;
  realizedPnl: number;
  chainPnlUsd: Record<Chain, number>;
  chainPnlPercent: Record<Chain, number>;
}

export interface HistoryPoint {
  timestamp: number;
  value: number;
  nativeValue: number; // Value in PLS
  pnl: number;
  chainPnl?: Record<Chain, number>;
}

/** Normalized financial transaction types.
 *  - deposit   : tokens/native arriving in a wallet (transfer-in)
 *  - withdraw  : tokens/native leaving a wallet (transfer-out)
 *  - swap      : atomic exchange of one asset for another
 */
export type TransactionType = 'deposit' | 'withdraw' | 'swap';

export interface Transaction {
  /** Unique identifier (hash-based). */
  id: string;
  /** On-chain transaction hash. */
  hash: string;
  /** Unix epoch milliseconds. */
  timestamp: number;
  type: TransactionType;
  /** Sender address (lowercase). */
  from: string;
  /** Receiver address (lowercase). */
  to: string;
  /** Symbol of the primary asset (received for deposit/swap, sent for withdraw). */
  asset: string;
  /** Amount of the primary asset. */
  amount: number;
  /** USD value at time of transaction (optional - may be 0 for older txs). */
  valueUsd?: number;
  /** Gas fee paid in native token (PLS or ETH). */
  fee?: number;
  chain: Chain;
  // -- Swap-only fields ------------------------------------------------------
  /** Asset that was spent in the swap (the "sell" side). */
  counterAsset?: string;
  /** Amount of counterAsset spent. */
  counterAmount?: number;
  /** Estimated USD price per received asset at swap time or last sync. */
  assetPriceUsdAtTx?: number;
  /** Estimated USD price per spent asset at swap time or last sync. */
  counterPriceUsdAtTx?: number;
  /** Historic price of asset in native token (PLS/WPLS) at time of tx. Used for enrichment. */
  assetPriceNativeAtTx?: number;
  /** Historic price of counter asset in native token (PLS/WPLS) at time of tx. Used for enrichment. */
  counterPriceNativeAtTx?: number;
  /** Date transaction occurred. Used for historic price lookups during enrichment. */
  txDate?: Date;
  /** True when only the spent side of an on-chain swap was available from the explorer. */
  swapLegOnly?: boolean;
  bridged?: boolean;
  status?: string;
  /** Present when this transaction was routed via Liberty Swap cross-chain bridge. */
  libertySwap?: {
    dstChainId: number;
    orderId: string;
  };
  /** Token contract address for the asset (for CoinGecko lookup). */
  assetTokenAddress?: string;
  /** Token contract address for the counter asset (for CoinGecko lookup). */
  counterTokenAddress?: string;
}

/** Displayed portfolio price card in frontend (markets view). */
export interface PortfolioPriceCard {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  accent: string;
  logo?: string;
}

/** Theme/color palette for UI components. */
export interface ThemeColors {
  green: string;
  red: string;
  card: string;
  border: string;
  cardHigh: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  expandedBg: string;
  borderLight: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/** DexScreener pair data for token pricing and trading metrics. */
export interface DexScreenerPair {
  chainId?: string;
  pairAddress?: string;
  address?: string;
  dexId?: string;
  url?: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative?: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h24?: number;
  };
  priceChange?: {
    m5?: number;
    h1?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label?: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

/** DexScreener API response wrapper. */
export interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
  schemaVersion?: string;
  pair?: DexScreenerPair;
}

/** CoinGecko token market data. */
export interface CoinGeckoTokenData {
  id?: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  ath?: number;
  atl?: number;
  last_updated?: string;
}

/** Blockscout transaction data from blockchain explorers. */
export interface BlockscoutTransaction {
  hash: string;
  from?: { hash: string };
  to?: { hash: string } | null;
  value?: string;
  gas?: string;
  gasPrice?: string;
  input?: string;
  blockNumber?: number;
  timestamp?: number;
  transactionIndex?: number;
  status?: 'success' | 'failed' | 'pending';
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/** Props for coin list items in market views. */
export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
  chain: Chain;
  address?: string;
  logoUrl?: string;
  priceUsd: number;
  change24h: number;
  valueUsd: number;
}

/** Modal visibility and control props. */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Add coin modal specific props. */
export interface AddCoinModalProps extends ModalProps {
  onAdd: (coin: { symbol: string; name: string; chain: Chain; contractAddress: string }) => void;
  theme?: 'dark' | 'light';
}

/** Page header props. */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/** Stat grid item configuration. */
export interface StatGridItem {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
}

/** Stat grid props. */
export interface StatGridProps {
  cols?: 2 | 3 | 4;
  items: StatGridItem[];
}

/** TX type pills filter props. */
export interface TxTypePillsProps {
  value: string;
  onChange: (value: string) => void;
}

/** Holdings table display props. */
export interface HoldingsTableProps {
  assets: Asset[];
  allAssets: Asset[];
  wallets: Wallet[];
  totalValueUsd: number;
  priceChangePeriod: '1h' | '6h' | '24h' | '7d';
}

/** Liquidity position card props. */
export interface LiquidityPositionCardProps {
  position: LpPositionEnriched;
  selectedWallet?: string;
  onStakeClick?: () => void;
  onUnstakeClick?: () => void;
}

/** Staking section display props. */
export interface StakesSectionProps {
  stakes: HexStake[];
  totalValue: number;
  onStakeClick?: (stake: HexStake) => void;
}

/** P&L modal props. */
export interface PnLModalProps extends ModalProps {
  asset: Asset;
}

/** Profit planner modal props. */
export interface ProfitPlannerModalProps extends ModalProps {
  asset: Asset;
}

/** Holdings table display asset extends base Asset with extra fields. */
export interface HoldingDisplayAsset extends Asset {
  change: number;
}

/** P&L Card display props. */
export interface TokenPnLCardProps {
  asset: Asset;
  isSelected?: boolean;
  onClick?: () => void;
}

/** Transaction list props. */
export interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
}

/** DexScreener watchlist pair in MarketWatch. */
export interface WatchPair {
  chainId: string;
  pairAddress: string;
  dexScreenerUrl: string;
}

// ============================================================================
// CONTEXT & STATE TYPES
// ============================================================================

/** Modal state reducer action. */
export interface ModalAction {
  type: 'OPEN' | 'CLOSE' | 'REPLACE';
  modal?: ModalType;
  payload?: {
    selectedModalId?: string | null;
    confirmActionMessage?: string;
    confirmActionCallback?: (() => void) | null;
    isLoadingModal?: boolean;
    modalError?: string | null;
    tokenCardModalLoading?: boolean;
  };
}

/** Complete modal state. */
export interface ModalState {
  openModal: ModalType | null;
  previousModal: ModalType | null;
  selectedModalId: string | null;
  confirmActionMessage: string;
  confirmActionCallback: (() => void) | null;
  isLoadingModal: boolean;
  modalError: string | null;
  tokenCardModalLoading: boolean;
}

/** Modal types handled by the app. */
export type ModalType =
  | 'addWallet'
  | 'removeWallet'
  | 'marketWatch'
  | 'priceCard'
  | 'investmentDetail'
  | 'stakeDetail'
  | 'lpDetail'
  | 'farmDetail'
  | 'confirmAction'
  | 'settings'
  | 'help'
  | 'about'
  | 'customCoins'
  | 'apiKey'
  | 'tokenCard';

/** AppModals context state and setters. */
export interface AppModalsContextType {
  showAddWallet: boolean;
  showRemoveWallet: boolean;
  showMarketWatch: boolean;
  showPriceCard: boolean;
  showInvestmentDetail: boolean;
  showStakeDetail: boolean;
  showLpDetail: boolean;
  showFarmDetail: boolean;
  showConfirmAction: boolean;
  showSettings: boolean;
  showHelp: boolean;
  showAbout: boolean;
  selectedModalId: string | null;
  confirmActionMessage: string;
  confirmActionCallback: (() => void) | null;
  isLoadingModal: boolean;
  modalError: string | null;
  setShowAddWallet: (show: boolean) => void;
  setShowRemoveWallet: (show: boolean) => void;
  setShowMarketWatch: (show: boolean) => void;
  setShowPriceCard: (show: boolean) => void;
  setShowInvestmentDetail: (show: boolean) => void;
  setShowStakeDetail: (show: boolean) => void;
  setShowLpDetail: (show: boolean) => void;
  setShowFarmDetail: (show: boolean) => void;
  setShowConfirmAction: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setShowAbout: (show: boolean) => void;
  setSelectedModalId: (id: string | null) => void;
  setConfirmActionMessage: (message: string) => void;
  setConfirmActionCallback: (callback: (() => void) | null) => void;
  setIsLoadingModal: (loading: boolean) => void;
  setModalError: (error: string | null) => void;
}

// ============================================================================
// UTILITY & ASYNC TYPES
// ============================================================================

/** Async operation state wrapper. */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** Paginated API response. */
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** DexScreener search result. */
export interface DexScreenerSearchResult {
  chainId: string;
  pairAddress: string;
  dexScreenerUrl: string;
}

/** Market watch pair with enriched data. */
export interface WatchPairEnriched {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address: string; symbol: string };
  priceUsd: string | null;
  priceChange: { h1: number | null; h24: number | null };
  volume24h: number;
  liquidityUsd: number;
  marketCap: number | null;
  fdv: number | null;
  txns24h: number;
  imageUrl: string | null;
  dexScreenerUrl: string;
}

/** Holdings sort field options. */
export type HoldingSortField = 'value' | 'change';

/** Holdings sort direction. */
export type HoldingSortDir = 'asc' | 'desc';

/** Market watch sort options. */
export type MarketWatchSortKey = 'volume' | 'liquidity' | 'mcap' | 'change24h';

/** Swap detail data in transaction list. */
export interface SwapDetail {
  counterAsset: string;
  counterAmount: number;
  assetPriceUsd: number;
  counterPriceUsd: number;
}

/** Filter configuration for transaction display. */
export interface TxFilterConfig {
  type?: TransactionType;
  chain?: Chain;
  wallet?: string;
}

/** Bridge activity with transaction details. */
export type BridgeActivityChain = Chain | 'external';

export type BridgeActivity = Transaction & {
  fromChain: BridgeActivityChain;
  toChain: BridgeActivityChain;
  fromAsset: string;
  toAsset: string;
};

/** Grouped bridge activities by date. */
export interface BridgeActivityGroup {
  date: string;
  timestamp: number;
  events: BridgeActivity[];
}
