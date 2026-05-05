import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  Coins,
  Lock,
  TrendingUp,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCcw,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  ChevronRight,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  History,
  Filter,
  Download,
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  Eye,
  EyeOff,
  Calculator,
  X,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Pencil,
  Check,
  KeyRound,
  Zap,
  BarChart2,
  Droplets,
  Shield,
  Menu
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import PulseChainCommunityPage from './components/PulseChainCommunityPage';
import BridgeDashboardPage from './components/BridgeDashboardPage';
import { format } from 'date-fns';
import { createPublicClient, http, fallback, formatUnits, getAddress } from 'viem';
import { cn } from './lib/utils';
import { CHAINS, HEX_ABI, TOKENS, PULSEX_LP_PAIRS, PHEX_YIELD_PER_TSHARE, EHEX_YIELD_PER_TSHARE, PHEX_YIELD_BI_NUM, PHEX_YIELD_BI_DEN, EHEX_YIELD_BI_NUM, EHEX_YIELD_BI_DEN, FALLBACK_DESCRIPTIONS } from './constants';
import type { Asset, Wallet, Chain, HexStake, LpPosition, FarmPosition, HistoryPoint, Transaction } from './types';
import { LiquidityOverviewStrip, LiquiditySection } from './components/LiquiditySection';
import { AppModals } from './components/AppModals';
import { TransactionList } from './components/TransactionList';
import { HoldingsTable } from './components/HoldingsTable';
import type { HoldingDisplayAsset, HoldingSortField } from './components/HoldingsTable';
import { CoinList, type CoinListItem } from './components/CoinList';
import { PulseBoardFeed } from './components/PulseBoardFeed';
import { buildInvestmentRows } from './utils/buildInvestmentRows';
import { scheduleLocalStorageWrite, resolveBlockscoutBase, resolveEtherscanCompatBase } from './utils/localStorageDebounce';
import { BRAND_ASSETS } from './branding/brand-assets';
import { MyInvestmentsPage } from './pages/MyInvestmentsPage';
import { WalletAnalyzer } from './pages/WalletAnalyzer';
import { MyInvestmentsUtilityStrip } from './components/my-investments/MyInvestmentsUtilityStrip';
import { usePortfolio } from './context/PortfolioContext';
import { HistoryTab } from './tabs/HistoryTab';
import { StakesTab } from './tabs/StakesTab';
import { AssetsTab } from './tabs/AssetsTab';
import { WalletsTab } from './tabs/WalletsTab';
import { HomeTab } from './tabs/HomeTab';
import { OverviewTab } from './tabs/OverviewTab';
import { shortenAddr, normalizeAssetSymbol, sameAssetSymbol, tryReadCache, readStoredJSON, bigIntReviver, bigIntReplacer, isNoContractDataError, decodeLibertySwapInput } from './utils/appHelpers';
import { ERC20_ABI, WALLET_DOT_COLORS, CHAIN_COLORS, CHAIN_LABELS, STATIC_LOGOS, LIBERTY_SWAP_ROUTERS, LIBERTY_SWAP_SELECTOR, MIN_INVESTMENT_THRESHOLD, CORE_TOKENS, ACTIVE_TABS, ACTIVE_TAB_STORAGE_KEY, type ActiveTab } from './utils/appConstants';
import { useAppUI } from './context/AppUIContext';
import { useAppModals } from './context/AppModalsContext';

const PriceDisplay = ({ price, className }: { price: number, className?: string }) => {
  if (price === 0) return <span className={className}>$0.00</span>;

  // Handle very small prices with subscript for zeros
  if (price < 0.0001 && price > 0) {
    const priceStr = price.toFixed(12);
    const match = priceStr.match(/^0\.0+(?=[1-9])/);
    if (match) {
      const zerosCount = match[0].length - 2;
      const remaining = priceStr.slice(match[0].length);
      return (
        <span className={cn("font-mono", className)}>
          $0.0<sub className="price-sub">{zerosCount}</sub>{remaining.slice(0, 4)}
        </span>
      );
    }
  }

  return (
    <span className={cn("font-mono", className)}>
      ${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: price < 1 ? 6 : 2
      })}
    </span>
  );
};

// -- StakingLadder -------------------------------------------------------------
// Bar chart showing stake distribution by 30-day end-date buckets (from pulsechain-dashboard)
function StakingLadder({ stakes }: { stakes: HexStake[] }) {
  if (!stakes || stakes.length === 0) return null;
  const bucketSize = 30;
  const buckets: Record<number, { totalShares: number; stakeCount: number; bucketRange: string }> = {};

  stakes.forEach(stake => {
    const days = Math.max(0, Math.min(5555, Math.floor(stake.daysRemaining ?? 0)));
    const bucketIdx = Math.floor(days / bucketSize);
    if (!buckets[bucketIdx]) {
      const start = bucketIdx * bucketSize;
      buckets[bucketIdx] = { totalShares: 0.001, stakeCount: 0, bucketRange: `${start}-${start + bucketSize - 1}` };
    }
    buckets[bucketIdx].totalShares = (buckets[bucketIdx].totalShares === 0.001 ? 0 : buckets[bucketIdx].totalShares) + (stake.tShares ?? 0);
    buckets[bucketIdx].stakeCount += 1;
  });

  const chartData = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, d]) => ({ daysRemaining: Number(idx) * bucketSize + bucketSize / 2, ...d }));

  const CustomTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip" style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>Days: {d.bucketRange}</div>
        <div>T-Shares: {d.totalShares.toFixed(2)}</div>
        <div>Stakes: {d.stakeCount}</div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 18px 10px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.6px' }}>Staking Ladder</div>
      <ResponsiveContainer width="100%" height={220} minWidth={1} minHeight={1}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="daysRemaining" tick={{ fill: 'var(--fg-subtle)', fontSize: 13 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false}
            label={{ value: 'Days Remaining', position: 'insideBottom', offset: -10, fill: 'var(--fg-subtle)', fontSize: 13 }} />
          <YAxis tick={{ fill: 'var(--fg-subtle)', fontSize: 13 }} axisLine={false} tickLine={false} scale="log" domain={['auto', 'auto']} allowDataOverflow={false} />
          <RechartsTooltip content={<CustomTip />} />
          <Bar dataKey="totalShares" fill="#00FF9F" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// -- StakingPie -----------------------------------------------------------------
// Donut chart showing HEX stake distribution grouped by wallet (from pulsechain-dashboard)
function StakingPie({ stakes, hexUsdPrice }: { stakes: HexStake[]; hexUsdPrice: number }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  if (!stakes || stakes.length === 0) return null;

  const byWallet: Record<string, { label: string; tShares: number; stakedHex: number; yieldHex: number; totalHex: number; totalUsd: number; count: number }> = {};
  stakes.forEach(s => {
    const key = s.walletAddress ?? s.id;
    const label = s.walletLabel ?? key.slice(0, 8) + '...';
    if (!byWallet[key]) byWallet[key] = { label, tShares: 0, stakedHex: 0, yieldHex: 0, totalHex: 0, totalUsd: 0, count: 0 };
    const tsh = s.tShares ?? 0;
    const staked = s.stakedHex ?? 0;
    const yld = s.stakeHexYield ?? 0;
    byWallet[key].tShares += tsh;
    byWallet[key].stakedHex += staked;
    byWallet[key].yieldHex += yld;
    byWallet[key].totalHex += staked + yld;
    byWallet[key].totalUsd += (staked + yld) * hexUsdPrice;
    byWallet[key].count += 1;
  });

  const totalTShares = Object.values(byWallet).reduce((a, b) => a + b.tShares, 0);
  const totalUsd = Object.values(byWallet).reduce((a, b) => a + b.totalUsd, 0);
  const totalHex = Object.values(byWallet).reduce((a, b) => a + b.totalHex, 0);

  const sorted = Object.values(byWallet).sort((a, b) => b.tShares - a.tShares);
  const threshold = 0.02;
  const large = sorted.filter(w => w.tShares / totalTShares >= threshold);
  const small = sorted.filter(w => w.tShares / totalTShares < threshold);
  const chartData = small.length > 0
    ? [...large, { label: 'Others', tShares: small.reduce((a, b) => a + b.tShares, 0), totalUsd: small.reduce((a, b) => a + b.totalUsd, 0), count: small.reduce((a, b) => a + b.count, 0) }]
    : large;

  const GRADIENT = ['#00FF9F', '#627EEA', '#f739ff', '#fb923c', '#3b82f6', '#a855f7'];
  const getColor = (i: number) => GRADIENT[i % GRADIENT.length];

  const fmtK = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(0);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
      <g>
        <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--fg-subtle)" fontSize="12">{payload.label}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--fg)" fontSize="18" fontWeight="700">{fmtK(payload.tShares)}</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill="var(--fg-subtle)" fontSize="11">T-Shares</text>
        <Pie data={[]} cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} dataKey="value" />
      </g>
    );
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 18px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.6px' }}>Stake Distribution</div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
          <span style={{ color: 'var(--fg)', fontWeight: 700 }}>${fmtK(totalUsd)}</span>
          {'  -  '}<span style={{ color: '#fb923c' }}>{fmtK(totalHex)} HEX</span>
          {'  -  '}<span style={{ color: 'var(--accent)' }}>{fmtK(totalTShares)} T-Shares</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="tShares"
            activeIndex={activeIndex} activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}>
            {chartData.map((_, i) => <Cell key={i} fill={getColor(i)} />)}
          </Pie>
          <RechartsTooltip formatter={(val: any, _: any, entry: any) => [`${fmtK(Number(val))} T-Shares  -  $${fmtK(entry.payload.totalUsd)}`, entry.payload.label]} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 4 }}>
        {chartData.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(i), flexShrink: 0 }} />
            <span>{w.label}</span>
            <span style={{ color: 'var(--fg-subtle)' }}>({w.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Wallet Selector ---------------------------------------------------------

interface WalletSelectorProps {
  wallets: string[];
  activeWallet: string | null;
  onSelect: (addr: string | null) => void;
  onAdd: () => void;
  onRemove?: (addr: string) => void;
  walletLabels?: Record<string, string>;
}

function WalletSelector({ wallets, activeWallet, onSelect, onAdd, onRemove, walletLabels = {} }: WalletSelectorProps) {
  if (wallets.length === 0) {
    return (
      <button onClick={onAdd} className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
        <span style={{ fontSize: 14 }}>+</span> Add Wallet
      </button>
    );
  }
  return (
    <div className="wallet-selector-bar">
      <button className={`wallet-pill${activeWallet === null ? ' active' : ''}`} onClick={() => onSelect(null)}>
        <span className="wallet-dot wallet-dot-multi" />
        All
      </button>
      {wallets.map((addr, idx) => {
        const label = walletLabels[addr] ?? shortenAddr(addr);
        const dotColor = WALLET_DOT_COLORS[idx % WALLET_DOT_COLORS.length];
        const isActive = activeWallet === addr;
        return (
          <span
            key={addr}
            className={`wallet-pill${isActive ? ' active' : ''}`}
            title={addr}
            style={isActive ? {
              background: `${dotColor}1a`,
              borderColor: `${dotColor}55`,
              color: dotColor,
            } : undefined}
          >
            <span
              onClick={() => onSelect(addr)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <span className="wallet-dot" style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}bb` }} />
              {label}
            </span>
            {onRemove && (
              <button
                className="wallet-pill-x"
                onClick={e => { e.stopPropagation(); onRemove(addr); }}
                title={`Remove ${label}`}
                aria-label={`Remove ${label}`}
              >
                x
              </button>
            )}
          </span>
        );
      })}
      <button
        className="wallet-pill-add"
        onClick={onAdd}
        title="Add wallet"
        aria-label="Add wallet"
      >
        +
      </button>
    </div>
  );
}

// Note: STATIC_LOGOS, EHEX_PULSECHAIN_ADDR, ETH_HEX_ADDR, normalizeAssetSymbol, sameAssetSymbol,
// MIN_INVESTMENT_THRESHOLD, LIBERTY_SWAP_ROUTERS, LIBERTY_SWAP_SELECTOR, decodeLibertySwapInput,
// ActiveTab, ACTIVE_TABS, ACTIVE_TAB_STORAGE_KEY are now imported from ./utils/appConstants and ./utils/appHelpers

const readStoredActiveTab = (): ActiveTab => {
  if (typeof window === 'undefined') return 'home';
  const saved = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  if (saved === 'wallets') return 'assets';
  return ACTIVE_TABS.includes(saved as ActiveTab) ? (saved as ActiveTab) : 'home';
};

export default function App() {
  const {
    wallets, realAssets, realStakes, lpPositions, farmPositions, transactions,
    history, prices, tokenLogos, walletAssets, hideDust, hideSpam, spamTokenIds,
    hiddenTokens, hiddenTxIds, manualEntries, tokenMarketData, customCoins,
    etherscanApiKey, collapsedSections, theme, isLoading, lastUpdated,
    setWallets, setRealAssets, setPrices, setTokenLogos, setHideDust, setHideSpam,
    setSpamTokenIds, setHiddenTokens, setHiddenTxIds, setManualEntries,
    setTokenMarketData, setCustomCoins, setEtherscanApiKey, setCollapsedSections,
    setTheme, setTransactions, fetchPortfolio
  } = usePortfolio();


  const {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    mobileMoreOpen,
    setMobileMoreOpen,
    mobileHistoryOpen,
    setMobileHistoryOpen,
    selectedInvestment,
    setSelectedInvestment,
    selectedStake,
    setSelectedStake,
    selectedLpPosition,
    setSelectedLpPosition,
    selectedFarmPosition,
    setSelectedFarmPosition,
    priceCardFilter,
    setPriceCardFilter,
    priceCardSearch,
    setPriceCardSearch,
    showDustFilter,
    setShowDustFilter,
    yieldUnit,
    setYieldUnit,
    priceChartPeriod,
    setPriceChartPeriod,
    gainLossView,
    setGainLossView,
  } = useAppUI();

  const {
    showAddWallet,
    setShowAddWallet,
    showRemoveWallet,
    setShowRemoveWallet,
    showMarketWatch,
    setShowMarketWatch,
    showPriceCard,
    setShowPriceCard,
    showInvestmentDetail,
    setShowInvestmentDetail,
    showStakeDetail,
    setShowStakeDetail,
    showLpDetail,
    setShowLpDetail,
    showFarmDetail,
    setShowFarmDetail,
    showConfirmAction,
    setShowConfirmAction,
    showSettings,
    setShowSettings,
    showHelp,
    setShowHelp,
    showAbout,
    setShowAbout,
    selectedModalId,
    setSelectedModalId,
    confirmActionMessage,
    setConfirmActionMessage,
    confirmActionCallback,
    setConfirmActionCallback,
    isLoadingModal,
    setIsLoadingModal,
    modalError,
    setModalError,
  } = useAppModals();

  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [walletFormError, setWalletFormError] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [editingWalletAddress, setEditingWalletAddress] = useState<string | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [isCustomCoinsModalOpen, setIsCustomCoinsModalOpen] = useState(false);
  const [customCoinDraft, setCustomCoinDraft] = useState({ symbol: '', name: '', balance: '', price: '' });
  const [receivedCoinFilter, setReceivedCoinFilter] = useState<string>('all');
  const [receivedChainFilter, setReceivedChainFilter] = useState<string>('all');
  const [timeSinceLastUpdate, setTimeSinceLastUpdate] = useState<number>(0);

  const [marketWatchInitialSearch, setMarketWatchInitialSearch] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [activeWallet, setActiveWallet] = useState<string | null>(null);


  // -- Formatting helpers (defined once here, used throughout) ----------------
  const fmtBigNum = (n: number) => !isFinite(n) ? '0' : Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
  const fmtDec = (n: number, dp = 2) => {
    if (!isFinite(n)) return '0';
    const safeDp = Math.min(Math.max(Math.abs(dp), 0), 20);
    return n.toLocaleString('en-US', { minimumFractionDigits: safeDp, maximumFractionDigits: safeDp });
  };
  const fmtTok = (n: number) => {
    if (!isFinite(n)) return '0';
    return n > 1e6 ? `${(n/1e6).toFixed(2)}M` : n > 1000 ? `${(n/1000).toFixed(2)}K` : n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };
  // -- CSV Export helper ------------------------------------------------------
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escCell = (c: string | number) => {
      const s = String(c);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers, ...rows].map(r => r.map(escCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };


  useEffect(() => {
    localStorage.setItem('custom_coins', JSON.stringify(customCoins));
  }, [customCoins]);

  const addCustomCoin = (coin: any) => {
    setCustomCoins([...customCoins, { ...coin, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeCustomCoin = (id: string) => {
    setCustomCoins(customCoins.filter(c => c.id !== id));
  };

  const submitCustomCoin = () => {
    const symbol = customCoinDraft.symbol.trim().toUpperCase();
    const name = customCoinDraft.name.trim() || symbol;
    const balance = Number(customCoinDraft.balance);
    const price = Number(customCoinDraft.price || 0);
    if (!symbol || !Number.isFinite(balance) || balance <= 0 || !Number.isFinite(price) || price < 0) return;
    addCustomCoin({ symbol, name, balance, price });
    setCustomCoinDraft({ symbol: '', name: '', balance: '', price: '' });
    setIsCustomCoinsModalOpen(false);
    setActiveTab('overview');
  };
  const [pnlAsset, setPnlAsset] = useState<Asset | null>(null);
  const [selectedBridgeTxId, setSelectedBridgeTxId] = useState<string | null>(null);
  const [profitPlannerOpen, setProfitPlannerOpen] = useState(false);
  const [showReceivedAssets, setShowReceivedAssets] = useState(true);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<number | null>(null);

  useEffect(() => {
    if (selectedWalletAddr === 'all') return;
    const stillExists = wallets.some(w => w.address.toLowerCase() === selectedWalletAddr);
    if (!stillExists) {
      setSelectedWalletAddr('all');
      setActiveWallet(null);
    }
  }, [selectedWalletAddr, wallets]);

  // Apply theme to document

  // Prevent background scroll when the mobile sidebar drawer is open.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    const previousOverflow = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [activeTab]);

  // Theme-aware color helpers - CSS variable-backed for automatic light/dark theming
  const t = useMemo(() => ({
    surface: 'var(--bg-void)',
    card: 'var(--bg-surface)',
    cardHigh: 'var(--bg-elevated)',
    cardHighest: 'var(--bg-elevated)',
    border: 'var(--border)',
    borderLight: 'var(--border)',
    text: 'var(--fg)',
    textSecondary: 'var(--fg-muted)',    /* labels, prices, percent values - strong contrast */
    textMuted: 'var(--fg-subtle)',       /* icons and separators - strong contrast */
    textTertiary: 'var(--fg-subtle)',    /* helper text - strong contrast */
    sidebar: 'var(--bg-sidebar)',
    header: 'var(--bg-header)',
    hoverBg: 'var(--bg-elevated)',
    expandedBg: 'var(--bg-elevated)',
    green: theme === 'dark' ? '#00FF9F' : '#059669',
    red: theme === 'dark' ? '#f43f5e' : '#dc2626',
    purple: '#8b5cf6',
    orange: '#f97316',
    blue: 'var(--chain-eth)',
    pink: 'var(--chain-pulse)',
    gradientHero: theme === 'dark'
      ? 'linear-gradient(135deg, #0b1a12 0%, #08100e 40%, #080d16 100%)'
      : 'linear-gradient(135deg, #eef8f4 0%, #f5f5f5 40%, #eef0fa 100%)',
  }), [theme]);

  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const isCollapsed = (id: string) => !!collapsedSections[id];

  // -- Portfolio cache persistence (prevents blank screen on reload) ----------
  // Writes are debounced (500ms) so rapid price/asset updates don't block the main thread
  // with large JSON.stringify + localStorage.setItem calls on every tick.

  useEffect(() => {
    if (wallets.length > 0) {
      fetchPortfolio();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPortfolio();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [wallets]);

  useEffect(() => {
    if (isAddingWallet) setWalletFormError('');
  }, [isAddingWallet]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        setTimeSinceLastUpdate(Math.floor((Date.now() - lastUpdated) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const addWallet = () => {
    const normalizedInput = newWalletAddress.trim();
    let checksummedAddress = '';

    try {
      checksummedAddress = getAddress(normalizedInput);
    } catch {
      setWalletFormError('Enter a valid EVM wallet address (0x...).');
      return;
    }

    // Prevent duplicate wallets
    if (wallets.some(w => w.address.toLowerCase() === checksummedAddress.toLowerCase())) {
      setWalletFormError('This wallet has already been added.');
      return;
    }

    const trimmedName = newWalletName.trim();
    const newWallet: Wallet = {
      address: checksummedAddress,
      name: trimmedName || `Wallet ${wallets.length + 1}`
    };
    setWallets([...wallets, newWallet]);
    setNewWalletAddress('');
    setNewWalletName('');
    setWalletFormError('');
    setIsAddingWallet(false);
  };

  const removeWallet = (address: string) => {
    setWallets(wallets.filter(w => w.address !== address));
  };

  const renameWallet = (address: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWallets(wallets.map(w => w.address === address ? { ...w, name: trimmed } : w));
    setEditingWalletAddress(null);
  };

  const scanForSpam = async () => {
    const baseAssets = wallets.length > 0 ? realAssets : [];
    const unpriced = baseAssets.filter(a => a.price === 0 && (a as any).address && (a as any).address !== 'native');
    if (unpriced.length === 0) { setScanResult(0); return; }
    setIsScanning(true);
    setScanResult(null);
    const newSpamIds: string[] = [...spamTokenIds];
    let detected = 0;

    // For Ethereum tokens use DeFi Llama (most comprehensive price coverage)
    const ethAssets = unpriced.filter(a => a.chain === 'ethereum');
    const otherAssets = unpriced.filter(a => a.chain !== 'ethereum');

    if (ethAssets.length > 0) {
      try {
        const keys = ethAssets.map(a => `ethereum:${(a as any).address.toLowerCase()}`);
        const r = await fetch(`https://coins.llama.fi/prices/current/${keys.join(',')}`);
        if (r.ok) {
          const data = await r.json();
          ethAssets.forEach(asset => {
            const key = `ethereum:${(asset as any).address.toLowerCase()}`;
            const hasPrice = data.coins?.[key]?.price != null;
            if (!hasPrice && !newSpamIds.includes(asset.id)) {
              newSpamIds.push(asset.id);
              detected++;
            }
          });
        }
      } catch { /* ignore */ }
    }

    // For PulseChain/Base tokens use Blockscout
    await Promise.allSettled(otherAssets.map(async (asset) => {
      try {
        const addr = (asset as any).address;
        const host = asset.chain === 'base' ? 'base.blockscout.com' : 'scan.pulsechain.com';
        const r = await fetch(`https://${host}/api/v2/tokens/${addr}`);
        if (!r.ok) return;
        const data = await r.json();
        const hasMarket = data.exchange_rate || data.circulating_market_cap || data.volume_24h;
        if (!hasMarket && !newSpamIds.includes(asset.id)) {
          newSpamIds.push(asset.id);
          detected++;
        }
      } catch { /* ignore */ }
    }));

    setSpamTokenIds(newSpamIds);
    setIsScanning(false);
    setScanResult(detected);
  };

  const assetUniverse = useMemo(() => {
    const activeWalletKey = activeWallet?.toLowerCase() ?? null;
    const baseAssets = wallets.length > 0
      ? (activeWalletKey ? (walletAssets[activeWalletKey] || []) : realAssets)
      : [];
    const assetsWithCustom = [...baseAssets];

    customCoins.forEach(coin => {
      assetsWithCustom.push({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        balance: coin.balance,
        price: coin.price,
        value: coin.balance * coin.price,
        chain: 'custom' as any,
        pnl24h: 0
      });
    });

    return assetsWithCustom;
  }, [wallets.length, realAssets, walletAssets, activeWallet, customCoins]);

  const hideToken = (id: string) => {
    setHiddenTokens(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const unhideToken = (id: string) => {
    setHiddenTokens(prev => prev.filter(tokenId => tokenId !== id));
  };

  const currentAssets = useMemo(() => {
    return assetUniverse
      .filter(a => !hiddenTokens.includes(a.id))
      .filter(a => !hideDust || a.value >= 1 || (a.balance > 0 && a.price === 0))
      .filter(a => !hideSpam || (!(a as any).isSpam && !spamTokenIds.includes(a.id)))
      .map(a => {
        const addr = (a as any).address?.toLowerCase?.();
        const isEHex = (a.chain === 'ethereum' && addr === ETH_HEX_ADDR) || (a.chain === 'pulsechain' && addr === EHEX_PULSECHAIN_ADDR);
        if (isEHex) {
          const ehexPriceData = prices['hex'] || prices[`ethereum:${ETH_HEX_ADDR}`];
          if (ehexPriceData?.usd) {
            const price = ehexPriceData.usd;
            return {
              ...a,
              price,
              value: a.balance * price,
              priceChange24h: ehexPriceData.usd_24h_change ?? a.priceChange24h,
              priceChange1h: ehexPriceData.usd_1h_change ?? a.priceChange1h,
              priceChange7d: ehexPriceData.usd_7d_change ?? a.priceChange7d,
              pnl24h: ehexPriceData.usd_24h_change ?? a.pnl24h,
              entryPls: manualEntries[a.id] || 0
            };
          }
        }
        return {
          ...a,
          entryPls: manualEntries[a.id] || 0
        };
      });
  }, [assetUniverse, manualEntries, hiddenTokens, hideDust, hideSpam, spamTokenIds, prices]);

  const currentStakes = useMemo(() => {
    if (wallets.length === 0) return [];
    const key = activeWallet?.toLowerCase() ?? null;
    return key ? realStakes.filter(s => s.walletAddress === key) : realStakes;
  }, [wallets.length, realStakes, activeWallet]);

  const normalizeHoldingAssets = useMemo(() => {
    const plsUsdPrice = prices['pulsechain']?.usd || 0;
    const leagueSymbols = new Set(['PLS', 'PLSX', 'HEX', 'EHEX', 'INC', 'PRVX']);
    return (assets: Asset[]): HoldingDisplayAsset[] =>
      assets.map(asset => {
        const symbolUpper = asset.symbol.toUpperCase();
        const isLeagueSupported = leagueSymbols.has(symbolUpper);
        return {
          ...asset,
          priceUsd: asset.price,
          pricePls: plsUsdPrice > 0 ? asset.price / plsUsdPrice : 0,
          valueUsd: asset.value,
          valuePls: plsUsdPrice > 0 ? asset.value / plsUsdPrice : 0,
          leagueLabel: isLeagueSupported ? 'League' : '-',
          leagueRank: null,
          leagueSource: isLeagueSupported ? 'OpenPulseChain' : null,
          entryPls: manualEntries[asset.id] || 0,
        };
      });
  }, [manualEntries, prices]);

  const currentHistory = wallets.length > 0 ? history : [];
  const currentTransactions = useMemo(() => {
    const baseTransactions = wallets.length > 0 ? transactions : [];
    return baseTransactions.map(tx => ({
      ...tx,
      asset: normalizeAssetSymbol(tx.asset, tx.chain),
      counterAsset: tx.counterAsset ? normalizeAssetSymbol(tx.counterAsset, tx.chain) : tx.counterAsset,
    }));
  }, [wallets.length, transactions]);

  const unpricedCount = useMemo(() => {
    return currentAssets.filter(a => a.price === 0).length;
  }, [currentAssets]);

  const swapTransactions24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return currentTransactions.filter((tx) => {
      if (tx.chain !== 'pulsechain') return false;
      if (tx.timestamp < cutoff) return false;
      return tx.type === 'swap' || !!tx.swapLegOnly;
    });
  }, [currentTransactions]);

  const holdingsPulsechainTransactions = useMemo(() => {
    return currentTransactions;
  }, [currentTransactions]);

  const summary = useMemo(() => {
    const assets = currentAssets;
    const liquidValue = assets.reduce((acc, curr) => acc + curr.value, 0);

    // Add HEX staking value so the grand total reflects everything the user owns.
    // Recalculate accrued yield from tShares * daysStaked * chain-specific rate so
    // stale cached interestHearts never corrupt the total.
    const stakingValueUsd = currentStakes.reduce((acc, s) => {
      if ((s.daysRemaining ?? 0) <= 0) return acc; // exclude ended stakes
      const hexPriceKey = `${s.chain}:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39`;
      const chainHexFallback = s.chain === 'pulsechain' ? prices['pulsechain:hex']?.usd : prices['hex']?.usd;
      const hexPrice = prices[hexPriceKey]?.usd || chainHexFallback || 0;
      const stakedHex  = Number(s.stakedHearts ?? 0n) / 1e8;
      const tShares    = Number(s.stakeShares  ?? 0n) / 1e12;
      const daysStaked = Math.max(0, (s.stakedDays ?? 0) - (s.daysRemaining ?? 0));
      const rate = s.chain === 'pulsechain' ? PHEX_YIELD_PER_TSHARE : EHEX_YIELD_PER_TSHARE;
      const interestHex = tShares * daysStaked * rate;
      return acc + (stakedHex + interestHex) * hexPrice;
    }, 0);

    const totalValue = liquidValue + stakingValueUsd;
    const totalPnl = assets.reduce((acc, curr) => acc + (curr.value * (curr.pnl24h || 0) / 100), 0);

    const distribution: Record<Chain, number> = { pulsechain: 0, ethereum: 0, base: 0 };
    const chainPnlUsd: Record<Chain, number> = { pulsechain: 0, ethereum: 0, base: 0 };
    const chainPnlPercent: Record<Chain, number> = { pulsechain: 0, ethereum: 0, base: 0 };

    assets.forEach(a => {
      if (a.chain in distribution) {
        distribution[a.chain] += a.value;
        chainPnlUsd[a.chain] += (a.value * (a.pnl24h || 0) / 100);
      }
    });

    Object.keys(chainPnlUsd).forEach(chain => {
      const c = chain as Chain;
      if (distribution[c] > 0) {
        chainPnlPercent[c] = (chainPnlUsd[c] / distribution[c]) * 100;
      }
    });

    // Native Value (Portfolio Value in PLS terms)
    const plsPrice = assets.find(a => a.symbol === 'PLS')?.price || 0.00005;
    const nativeValue = totalValue / plsPrice;

    const nativePlsBalance = assets.find(a => a.symbol === 'PLS' && a.chain === 'pulsechain')?.balance || 0;
    const stakedPlsValue = currentStakes.reduce((acc, curr) => (
      (curr.daysRemaining ?? 0) > 0 ? acc + (curr.estimatedValueUsd / plsPrice) : acc
    ), 0);
    const tokenPlsValue = nativeValue - nativePlsBalance - stakedPlsValue;

    // Net Investment = total stablecoin + ETH received from external addresses into own wallets
    // Matches what's shown in Received Assets History: only ETH and stables, from external sources
    const ownAddrs = new Set(wallets.map(w => w.address.toLowerCase()));
    const isStableAsset = (asset: string) => {
      const u = asset.toUpperCase();
      return u.includes('USDC') || u.includes('USD COIN') || u.includes('USDBC') ||
             u.includes('USDT') || u.includes('TETHER') ||
             u.includes('DAI');
    };
    // Normalise asset name to a canonical category for bridge-echo matching
    const assetCategory = (asset: string) => {
      const u = asset.toUpperCase();
      if (u.includes('USDC') || u.includes('USD COIN') || u.includes('USDBC')) return 'USDC';
      if (u.includes('USDT') || u.includes('TETHER')) return 'USDT';
      if (u.includes('DAI')) return 'DAI';
      if (u === 'ETH') return 'ETH';
      return u;
    };
    // Collect all qualifying inflows first
    const qualifiedInflows = currentTransactions.filter(tx => {
      if (tx.type !== 'deposit') return false;
      if (tx.chain === 'pulsechain') return false; // always exclude; already counted via ETH/Base
      const assetUpper = tx.asset.toUpperCase();
      const isEth = assetUpper === 'ETH';
      const isStable = isStableAsset(tx.asset);
      if (!isEth && !isStable) return false;
      const fromOwn = ownAddrs.has(tx.from.toLowerCase());
      const toOwn = ownAddrs.has(tx.to.toLowerCase());
      if (fromOwn || !toOwn) return false;
      return true;
    }).sort((a, b) => a.timestamp - b.timestamp); // oldest first

    // Use the live prices state as a fallback for ETH valueUsd - this handles the case where
    // transactions were fetched before CoinGecko prices loaded (valueUsd would be 0 at that point).
    // Also try the pWETH LP-derived price (stored under 'ethereum:native') so the fallback
    // works even when CoinGecko is rate-limited.
    const ethPriceFallback = prices['ethereum']?.usd
      || prices['ethereum:native']?.usd
      || prices['pulsechain:0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c']?.usd
      || 0;
    // Helper: derive a consistent USD value for a tx (handles stale-zero valueUsd for ETH)
    const txUsdValue = (tx: { asset: string; valueUsd: number; amount: number }) => {
      if (tx.valueUsd > 0) return tx.valueUsd;
      if (tx.asset.toUpperCase() === 'ETH') return tx.amount * ethPriceFallback;
      return tx.amount; // stablecoins: amount is approximately USD
    };

    // Bridge-echo deduplication:
    // If the same asset+amount (within 1%) is received on a different chain within 12h,
    // treat the later one as a bridge echo and exclude it from netInvestment.
    // 1% tolerance for matching bridge echo amounts across chains
    const BRIDGE_AMOUNT_TOLERANCE = 0.01;
    const BRIDGE_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours
    const deduped = new Set<string>();
    qualifiedInflows.forEach((tx, i) => {
      if (deduped.has(tx.id)) return; // already marked as echo
      const cat = assetCategory(tx.asset);
      const usd = txUsdValue(tx);
      for (let j = i + 1; j < qualifiedInflows.length; j++) {
        const other = qualifiedInflows[j];
        if (deduped.has(other.id)) continue;
        if (other.chain === tx.chain) continue; // same chain: not a bridge
        if (other.timestamp - tx.timestamp > BRIDGE_WINDOW_MS) break; // time window exceeded
        const otherCat = assetCategory(other.asset);
        if (otherCat !== cat) continue;
        const otherUsd = txUsdValue(other);
        const maxVal = Math.max(usd, otherUsd, 1);
        if (Math.abs(usd - otherUsd) / maxVal <= BRIDGE_AMOUNT_TOLERANCE) {
          deduped.add(other.id); // mark later occurrence as bridge echo
        }
      }
    });

    const netInvestment = qualifiedInflows.reduce((acc, tx) => {
      if (deduped.has(tx.id)) return acc; // skip bridge echoes
      const assetUpper = tx.asset.toUpperCase();
      const isEth = assetUpper === 'ETH';
      if (isStableAsset(tx.asset)) return acc + tx.amount;
      if (isEth) return acc + txUsdValue(tx);
      return acc;
    }, 0);

    const unifiedPnl = totalValue - netInvestment;

    // Realized PNL Calculation with basic cost basis tracking
    const costBasisMap: Record<string, { amount: number, totalCost: number }> = {};
    let realizedPnl = 0;

    // Sort transactions by date to track cost basis chronologically
    const sortedTxs = [...currentTransactions].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedTxs.forEach(tx => {
      const addCost = (symbol: string, amount: number, value: number) => {
        const assetKey = `${tx.chain}:${symbol}`;
        if (!costBasisMap[assetKey]) costBasisMap[assetKey] = { amount: 0, totalCost: 0 };
        costBasisMap[assetKey].amount += amount;
        costBasisMap[assetKey].totalCost += value;
      };

      const realizeSale = (symbol: string, amount: number, value: number, countProfit: boolean) => {
        const assetKey = `${tx.chain}:${symbol}`;
        if (!costBasisMap[assetKey] || costBasisMap[assetKey].amount <= 0) return;
        const avgCost = costBasisMap[assetKey].totalCost / costBasisMap[assetKey].amount;
        const costOfSold = Math.min(costBasisMap[assetKey].totalCost, amount * avgCost);
        if (countProfit) realizedPnl += value - costOfSold;
        costBasisMap[assetKey].amount = Math.max(0, costBasisMap[assetKey].amount - amount);
        costBasisMap[assetKey].totalCost = Math.max(0, costBasisMap[assetKey].totalCost - costOfSold);
      };

      if (tx.type === 'deposit') {
        addCost(tx.asset, tx.amount, tx.valueUsd || 0);
      } else if (tx.type === 'withdraw') {
        realizeSale(tx.asset, tx.amount, tx.valueUsd || 0, false);
      } else if (tx.type === 'swap') {
        if (tx.counterAsset && tx.counterAmount) {
          realizeSale(tx.counterAsset, tx.counterAmount, tx.valueUsd || 0, true);
        }
        addCost(tx.asset, tx.amount, tx.valueUsd || 0);
      }
    });

    return {
      totalValue,
      liquidValue,
      stakingValueUsd,
      pnl24h: totalPnl,
      pnl24hPercent: totalValue > 0 ? (totalPnl / totalValue) * 100 : 0,
      chainDistribution: distribution,
      nativeValue,
      nativePlsBalance,
      stakedPlsValue,
      tokenPlsValue,
      netInvestment,
      unifiedPnl,
      realizedPnl,
      chainPnlUsd,
      chainPnlPercent
    };
  }, [currentAssets, currentStakes, currentTransactions, prices, wallets]);

  const pieData = Object.entries(summary.chainDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  })).filter(d => (d.value as number) > 0);

  const COLORS = [CHAINS.pulsechain.color, CHAINS.ethereum.color, CHAINS.base.color];

  const stakeSummary = useMemo(() => {
    const stakes = wallets.length > 0 ? realStakes : [];
    const activeStakes = stakes.filter(s => (s.daysRemaining ?? 0) > 0);
    let totalStakedHex = 0;
    let totalTShares = 0;
    let totalValueUsd = 0;
    let totalInterestHex = 0;

    activeStakes.forEach(s => {
      const stakedHex  = Number(s.stakedHearts ?? 0n) / 1e8;
      const tShares    = Number(s.stakeShares  ?? 0n) / 1e12;
      // Recalculate accrued yield from first principles using chain-specific rate
      // so stale cached interestHearts never corrupt the totals.
      const daysStaked  = Math.max(0, (s.stakedDays ?? 0) - (s.daysRemaining ?? 0));
      const rate = s.chain === 'pulsechain' ? PHEX_YIELD_PER_TSHARE : EHEX_YIELD_PER_TSHARE;
      const interestHex = tShares * daysStaked * rate;

      // Use chain-specific HEX price; fall back to 0 (not 0.004) so we show
      // $0 instead of a wrong value while prices are still loading.
      const hexPriceKey = `${s.chain}:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39`;
      const chainHexFallback = s.chain === 'pulsechain' ? prices['pulsechain:hex']?.usd : prices['hex']?.usd;
      const hexPrice = prices[hexPriceKey]?.usd || chainHexFallback || 0;

      totalStakedHex  += stakedHex;
      totalTShares    += tShares;
      totalValueUsd   += (stakedHex + interestHex) * hexPrice;
      totalInterestHex += interestHex;
    });

    const phexPrice = prices['pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd || prices['pulsechain:hex']?.usd || 0;
    // Daily payout uses chain-specific rates; sum pHEX and eHEX T-Share contributions separately
    const estimatedDailyPayoutHex = activeStakes.reduce((sum, s) => {
      const tS = Number(s.stakeShares ?? 0n) / 1e12;
      const rate = s.chain === 'pulsechain' ? PHEX_YIELD_PER_TSHARE : EHEX_YIELD_PER_TSHARE;
      return sum + tS * rate;
    }, 0);
    const estimatedDailyPayoutUsd = estimatedDailyPayoutHex * phexPrice;

    return {
      totalStakedHex,
      totalTShares,
      totalValueUsd,
      totalInterestHex,
      totalHexWithRewards: totalStakedHex + totalInterestHex,
      estimatedDailyPayoutHex,
      estimatedDailyPayoutUsd
    };
  }, [wallets.length, realStakes, prices]);

  const assetAllocation = useMemo(() => {
    // Aggregate by symbol across chains (e.g. ETH on Ethereum + ETH on Base)
    const agg: Record<string, number> = {};
    realAssets.filter(a => a.value > 0).forEach(a => {
      agg[a.symbol] = (agg[a.symbol] || 0) + a.value;
    });
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [realAssets]);

  const rotationSummary = useMemo(() => {
    let totalRotationPnlPls = 0;
    let totalRotationPnlUsd = 0;
    const plsPrice = prices['pulsechain']?.usd || 0.00005;

    realAssets.forEach(asset => {
      const entryPls = manualEntries[asset.id];
      if (entryPls && entryPls > 0) {
        const currentPlsValue = asset.value / plsPrice;
        const pnlPls = currentPlsValue - entryPls;
        totalRotationPnlPls += pnlPls;
        totalRotationPnlUsd += pnlPls * plsPrice;
      }
    });

    return {
      totalRotationPnlPls,
      totalRotationPnlUsd
    };
  }, [realAssets, manualEntries, prices]);

  const monthlyPnlData = useMemo(() => {
    const pts = history.length > 0 ? history : [];
    const byMonth: Record<string, { month: string; pnl: number }> = {};
    pts.forEach(p => {
      const key = format(p.timestamp, 'MMM yy');
      if (!byMonth[key]) byMonth[key] = { month: key, pnl: 0 };
      byMonth[key].pnl += p.pnl;
    });
    return Object.values(byMonth).slice(-12);
  }, [wallets.length, history]);

  const receivedAssetsData = useMemo(() => {
    const START_2021 = new Date('2021-01-01').getTime();
    const ethPrice = prices['ethereum']?.usd || 3400;
    const effectiveReceivedChainFilter = receivedChainFilter === 'pulsechain' ? 'all' : receivedChainFilter;

    const filtered = currentTransactions.filter(tx => {
      const typeMatch = tx.type === 'deposit' || (tx.type as string) === 'receive';
      const allowedBridgeChain = tx.chain === 'ethereum' || tx.chain === 'base';
      const chainMatch = allowedBridgeChain && (effectiveReceivedChainFilter === 'all' || tx.chain === effectiveReceivedChainFilter);
      const dateMatch = tx.timestamp >= START_2021;
      const assetUpper = tx.asset.toUpperCase();
      const assetMatch = assetUpper === 'ETH' ||
                         assetUpper === 'PLS' ||
                         assetUpper.includes('USDC') ||
                         assetUpper.includes('USD COIN') ||
                         assetUpper.includes('USDBC') ||
                         assetUpper.includes('USDT') ||
                         assetUpper.includes('TETHER') ||
                         assetUpper.includes('DAI');
      // Exclude dust (gas refunds, tiny transfers)
      const notDust = tx.valueUsd ? tx.valueUsd >= 1 : (tx.amount > 0.0001 || (assetUpper !== 'ETH' && assetUpper !== 'PLS' && tx.amount > 0.01));
      return typeMatch && chainMatch && dateMatch && assetMatch && notDust;
    });

    // Apply coin filter
    const coinFiltered = receivedCoinFilter === 'all' ? filtered : filtered.filter(tx => {
      const assetUpper = tx.asset.toUpperCase();
      if (receivedCoinFilter === 'ETH') return assetUpper === 'ETH';
      if (receivedCoinFilter === 'PLS') return assetUpper === 'PLS';
      if (receivedCoinFilter === 'USDC') return assetUpper.includes('USDC') || assetUpper.includes('USD COIN') || assetUpper.includes('USDBC');
      if (receivedCoinFilter === 'USDT') return assetUpper.includes('USDT') || assetUpper.includes('TETHER');
      if (receivedCoinFilter === 'DAI') return assetUpper.includes('DAI');
      return true;
    });

    // Sort oldest first - shows the full history chronologically
    const list = [...coinFiltered].sort((a, b) => a.timestamp - b.timestamp);

    // Per-asset totals
    const plsPrice = prices['pulsechain']?.usd || 0.00005;
    const getStablePrice = (tx: typeof list[0], stable: 'USDC' | 'USDT' | 'DAI') => {
      if (tx.chain === 'pulsechain') {
        if (stable === 'DAI') {
          return prices['pulsechain:0xefd766ccb38eaf1dfd701853bfce31359239f305']?.usd
            ?? prices['pulsechain:0x6b175474e89094c44da98b954eedeac495271d0f']?.usd
            ?? prices['pulsechain:dai']?.usd
            ?? 0;
        }
        if (stable === 'USDT') return prices['pulsechain:0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f']?.usd ?? 0;
        return prices['pulsechain:0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07']?.usd ?? 0;
      }
      if (stable === 'DAI') return prices['dai']?.usd ?? 0;
      if (stable === 'USDT') return prices['tether']?.usd ?? 1;
      return prices['usd-coin']?.usd ?? 1;
    };

    const getUsd = (tx: typeof list[0]) => {
      if (tx.valueUsd) return tx.valueUsd;
      const a = tx.asset.toUpperCase();
      if (a === 'ETH') return tx.amount * ethPrice;
      if (a === 'PLS') return tx.amount * plsPrice;
      if (a.includes('USDT') || a.includes('TETHER')) return tx.amount * getStablePrice(tx, 'USDT');
      if (a.includes('DAI')) return tx.amount * getStablePrice(tx, 'DAI');
      return tx.amount * getStablePrice(tx, 'USDC'); // USDC and other stables
    };

    const byAsset: Record<string, { amount: number; valueUsd: number }> = {};
    list.forEach(tx => {
      const assetUpper = tx.asset.toUpperCase();
      const key = assetUpper === 'PLS' ? 'PLS' :
                  assetUpper === 'ETH' ? 'ETH' :
                  assetUpper.includes('DAI') ? 'DAI' :
                  assetUpper.includes('USDT') || assetUpper.includes('TETHER') ? 'USDT' : 'USDC';
      if (!byAsset[key]) byAsset[key] = { amount: 0, valueUsd: 0 };
      byAsset[key].amount += tx.amount;
      byAsset[key].valueUsd += getUsd(tx);
    });

    const totalValue = list.reduce((acc, tx) => acc + getUsd(tx), 0);

    return { list, totalValue, byAsset };
  }, [currentTransactions, prices, receivedCoinFilter, receivedChainFilter]);

  // -- Fetch market data when token card modal opens ------------------------
  // For native PLS, use the WPLS contract address since DexScreener tracks WPLS pairs.
  const WPLS_ADDR = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';
  useEffect(() => {
    if (!tokenCardModal) return;
    const id   = tokenCardModal.id;
    const rawAddr = (tokenCardModal as any).address as string | undefined;
    // PLS is native - fall back to WPLS so we can show DexScreener market data
    const isNativePls = (!rawAddr || rawAddr === 'native') && tokenCardModal.chain === 'pulsechain';
    const addr = isNativePls ? WPLS_ADDR : rawAddr;
    if (!addr || addr === 'native') return;
    if (tokenMarketData[id]) { setTokenCardModalLoading(false); return; }
    setTokenCardModalLoading(true);
    (async () => {
      try {
        const bsBase = resolveBlockscoutBase();
        const [dsResult, holderResult] = await Promise.allSettled([
          fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`).then(r => r.ok ? r.json() : null),
          tokenCardModal?.chain === 'pulsechain' && !isNativePls
            ? fetch(`${bsBase}/tokens/${addr}`).then(r => r.ok ? r.json() : null)
            : Promise.resolve(null),
        ]);
        const data = dsResult.status === 'fulfilled' ? dsResult.value : null;
        const holderData = holderResult.status === 'fulfilled' ? holderResult.value : null;
        const holders: number | null = holderData?.holders ? (parseInt(String(holderData.holders), 10) || null) : null;
        if (!data) return;
        const pairs = data.pairs || [];
        if (pairs.length === 0) return;
        const sorted = [...pairs].sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const top = sorted[0];
        setTokenMarketData(prev => ({
          ...prev,
          [id]: {
            liquidity:      sorted.reduce((s: number, p: any) => s + (p.liquidity?.usd || 0), 0),
            volume24h:      sorted.reduce((s: number, p: any) => s + (p.volume?.h24 || 0), 0),
            marketCap:      top?.marketCap || null,
            fdv:            top?.fdv || null,
            pools:          pairs.length,
            txns24h:        sorted.reduce((s: number, p: any) => s + (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0), 0),
            nativePriceUsd: top?.priceNative || null,
            priceChange1h:  top?.priceChange?.h1  ?? null,
            priceChange6h:  top?.priceChange?.h6  ?? null,
            priceChange24h: top?.priceChange?.h24 ?? null,
            priceChange7d:  top?.priceChange?.d7  ?? null,
            description:    top?.info?.description || FALLBACK_DESCRIPTIONS[addr ? addr.toLowerCase() : ''] || null,
            websites:       top?.info?.websites    || [],
            socials:        top?.info?.socials     || [],
            ...(holders != null ? { holders } : {}),
          },
        }));
        // Cache DexScreener image into tokenLogos (helps overview cards)
        const dsImg = top?.info?.imageUrl;
        if (dsImg && !isNativePls && !STATIC_LOGOS[addr.toLowerCase()]) setTokenLogos(prev => ({ ...prev, [addr.toLowerCase()]: dsImg }));
      } catch { /* ignore */ }
      finally { setTokenCardModalLoading(false); }
    })();
  }, [tokenCardModal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Auto-fetch market data for top 9 overview assets when Overview tab is active --
  // This ensures all cards show live market data (mcap, liquidity, vol) without requiring
  // the user to click each card individually.
  useEffect(() => {
    if (activeTab !== 'overview' || currentAssets.length === 0) return;
    const topAssets = [...currentAssets].sort((a, b) => b.value - a.value).slice(0, 9);
    const toFetch = topAssets.filter(a => {
      const addr = (a as any).address;
      return addr && addr !== 'native' && !tokenMarketData[a.id];
    });
    if (toFetch.length === 0) return;
    Promise.all(toFetch.map(async (asset) => {
      const addr = (asset as any).address as string;
      const bsBase = resolveBlockscoutBase();
      try {
        // Fetch DexScreener data + Blockscout holder count in parallel
        const [dsResult, holderResult] = await Promise.allSettled([
          fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`).then(r => r.ok ? r.json() : null),
          asset.chain === 'pulsechain'
            ? fetch(`${bsBase}/tokens/${addr}`).then(r => r.ok ? r.json() : null)
            : Promise.resolve(null),
        ]);
        const data = dsResult.status === 'fulfilled' ? dsResult.value : null;
        const holderData = holderResult.status === 'fulfilled' ? holderResult.value : null;
        const holders: number | null = holderData?.holders ? (parseInt(String(holderData.holders), 10) || null) : null;
        if (!data) return;
        const pairs: any[] = data.pairs || [];
        if (pairs.length === 0) return;
        const sorted = [...pairs].sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const top = sorted[0];
        setTokenMarketData(prev => ({
          ...prev,
          [asset.id]: {
            ...prev[asset.id],
            liquidity:      sorted.reduce((s: number, p: any) => s + (p.liquidity?.usd || 0), 0),
            volume24h:      sorted.reduce((s: number, p: any) => s + (p.volume?.h24  || 0), 0),
            marketCap:      top?.marketCap || null,
            fdv:            top?.fdv || null,
            pools:          pairs.length,
            txns24h:        sorted.reduce((s: number, p: any) => s + (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0), 0),
            nativePriceUsd: top?.priceNative || null,
            priceChange1h:  top?.priceChange?.h1  ?? null,
            priceChange6h:  top?.priceChange?.h6  ?? null,
            priceChange24h: top?.priceChange?.h24 ?? null,
            priceChange7d:  top?.priceChange?.d7  ?? null,
            description:    top?.info?.description || FALLBACK_DESCRIPTIONS[addr ? addr.toLowerCase() : ''] || null,
            websites:       top?.info?.websites    || [],
            socials:        top?.info?.socials     || [],
            ...(holders != null ? { holders } : {}),
          },
        }));
        // Cache DexScreener image into tokenLogos - but never overwrite STATIC_LOGOS entries
        const dsImg = top?.info?.imageUrl;
        if (dsImg && !STATIC_LOGOS[addr.toLowerCase()]) setTokenLogos(prev => ({ ...prev, [addr.toLowerCase()]: dsImg }));
      } catch { /* ignore */ }
    }));
  }, [activeTab, currentAssets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- tokenPrices: symbol -> USD price map for LP hook ---------------------
  const tokenPrices = useMemo<Record<string, number>>(() => {
    const p = prices;
    const wplsUsd = p['pulsechain']?.usd ?? p['pulsechain:native']?.usd ?? 0;
    return {
      'WPLS':  wplsUsd,
      'PLS':   wplsUsd,
      'PLSX':  p['pulsechain:0x95b303987a60c71504d99aa1b13b4da07b0790ab']?.usd ?? p['pulsex']?.usd ?? 0,
      'INC':   p['pulsechain:0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d']?.usd ?? p['incentive']?.usd ?? 0,
      'pHEX':  p['pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd ?? p['pulsechain:hex']?.usd ?? 0,
      'pWETH': p['pulsechain:0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c']?.usd ?? p['ethereum']?.usd ?? 0,
      'pWBTC': p['pulsechain:0xb17d901469b9208b17d916112988a3fed19b5ca1']?.usd ?? p['wrapped-bitcoin']?.usd ?? 0,
      'pDAI':  p['pulsechain:0xefd766ccb38eaf1dfd701853bfce31359239f305']?.usd ?? 0,
      'pUSDC': p['pulsechain:0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07']?.usd ?? 0,
      'pUSDT': p['pulsechain:0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f']?.usd ?? 0,
    };
  }, [prices]);

  const explorerUrl = (chain: string, address: string) => {
    if (!address || address === 'native') return null;
    if (chain === 'pulsechain') return `https://scan.pulsechain.com/token/${address}`;
    if (chain === 'ethereum') return `https://etherscan.io/token/${address}`;
    if (chain === 'base') return `https://base.blockscout.com/token/${address}`;
    return null;
  };

  const dexScreenerUrl = (chain: string, address: string) => {
    if (!address || address === 'native') return null;
    const slug = chain === 'pulsechain' ? 'pulsechain' : chain === 'base' ? 'base' : 'ethereum';
    return `https://dexscreener.com/${slug}/${address}`;
  };

  const getTokenLogoUrl = useCallback((asset: Asset): string => {
    // 0. STATIC_LOGOS always wins - curated logos that must never be overwritten by any remote source
    const addrKey0 = (asset as any).address?.toLowerCase?.() as string | undefined;
    if (addrKey0 && STATIC_LOGOS[addrKey0]) return STATIC_LOGOS[addrKey0];
    // 1. Use any logo already fetched and stored on the asset (CoinGecko / DeFi Llama)
    if (asset.logoUrl) return asset.logoUrl;
    // 2. Well-known native / base tokens
    if (asset.symbol === 'ETH') return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
    if (asset.symbol === 'PLS' || asset.symbol === 'WPLS') return 'https://tokens.app.pulsex.com/images/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27.png';
    // 3. PulseChain tokens via PulseX CDN (URL path is case-sensitive - must use checksummed address)
    if (asset.chain === 'pulsechain') {
      const tokenConfig = TOKENS.pulsechain.find(t => t.symbol === asset.symbol);
      if (tokenConfig && tokenConfig.address !== 'native') {
        try { return `https://tokens.app.pulsex.com/images/tokens/${getAddress(tokenConfig.address)}.png`; } catch { /* invalid address */ }
      }
      // Also try the address stored directly on the asset (for discovered tokens)
      const addrOnAsset = (asset as any).address;
      if (addrOnAsset && addrOnAsset !== 'native') {
        try { return `https://tokens.app.pulsex.com/images/tokens/${getAddress(addrOnAsset)}.png`; } catch { /* invalid address */ }
      }
    }
    // 4. Ethereum + Base tokens via TrustWallet (also case-sensitive)
    if (asset.chain === 'ethereum' || asset.chain === 'base') {
      const chainName = asset.chain === 'base' ? 'base' : 'ethereum';
      const tokenConfig = (TOKENS[asset.chain] as any[]).find((t: any) => t.symbol === asset.symbol);
      if (tokenConfig && tokenConfig.address !== 'native') {
        try { return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${getAddress(tokenConfig.address)}/logo.png`; } catch { /* invalid address */ }
      }
    }
    // 5. Fall back to tokenLogos map (covers DexScreener CDN images cached during market-data fetch)
    if (addrKey0 && tokenLogos[addrKey0]) return tokenLogos[addrKey0];
    return '';
  }, [tokenLogos]);

  // Stable callbacks for TransactionList props
  const handleToggleHide = useCallback((id: string) => {
    setHiddenTxIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const handleFilterByAssetHistory = useCallback((symbol: string) => {
    setActiveTab('history');
  }, []);
  const handleFilterByAssetSwap = useCallback((symbol: string) => {
    setActiveTab('history');
  }, []);
  const handleFilterByAssetOnly = useCallback((symbol: string) => {
    // Filtering is now handled within HistoryTab component
  }, []);

  // -- RENDER ----------------------------------------------------------------

  const getFrontMarketChange = (marketData: any, priceData: any, asset?: Asset | null): number | null => {
    return marketData?.priceChange24h ?? priceData?.usd_24h_change ?? asset?.priceChange24h ?? asset?.pnl24h ?? null;
  };

  type PortfolioPriceCard = {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number | null;
    marketCap?: number | null;
    volume24h?: number | null;
    accent?: string;
    logo?: string;
  };

  const coreLiveTokens = useMemo(() => CORE_TOKENS, []);

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'home') return;
    const missing = coreLiveTokens.filter(token => !tokenMarketData[`live:${token.id}`]);
    if (missing.length === 0) return;
    const WPLS = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';
    missing.forEach(async (token) => {
      const rawAddr = token.priceKey === 'pulsechain' ? WPLS : token.priceKey.includes(':') ? token.priceKey.split(':')[1] : null;
      if (!rawAddr) return;
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${rawAddr.toLowerCase()}`);
        if (!res.ok) return;
        const data = await res.json();
        const pairs: any[] = data.pairs || [];
        if (pairs.length === 0) return;
        const expectedChain = token.priceKey.includes(':') ? token.priceKey.split(':')[0] : 'pulsechain';
        const chainPairs = pairs.filter((p: any) => p.chainId === expectedChain);
        const sorted = [...(chainPairs.length ? chainPairs : pairs)].sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const top = sorted[0];
        setTokenMarketData(prev => ({
          ...prev,
          [`live:${token.id}`]: {
            volume24h: sorted.reduce((s: number, p: any) => s + (p.volume?.h24 || 0), 0),
            marketCap: top?.marketCap || null,
            fdv: top?.fdv || null,
            priceChange5m: top?.priceChange?.m5 ?? null,
            priceChange1h: top?.priceChange?.h1 ?? null,
            priceChange6h: top?.priceChange?.h6 ?? null,
            priceChange24h: top?.priceChange?.h24 ?? null,
            priceChange7d: top?.priceChange?.d7 ?? null,
          },
        }));
      } catch { /* ignore */ }
    });
  }, [activeTab, coreLiveTokens]); // eslint-disable-line react-hooks/exhaustive-deps

  const topHoldingCards = useMemo<PortfolioPriceCard[]>(() => {
    return coreLiveTokens.map(token => {
      const md = prices[token.priceKey] || prices[token.changeKey ?? ''];
      const tokenAddress = token.priceKey.includes(':') ? token.priceKey.split(':')[1]?.toLowerCase() : '';
      const heldAsset = currentAssets.find(asset =>
        (tokenAddress && (asset as any).address?.toLowerCase?.() === tokenAddress) ||
        asset.symbol.toUpperCase() === token.symbol.toUpperCase()
      );
      const liveMarketData = tokenMarketData[`live:${token.id}`] || (heldAsset ? tokenMarketData[heldAsset.id] : null);
      return {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        price: md?.usd || heldAsset?.price || 0,
        change24h: getFrontMarketChange(liveMarketData, md, heldAsset),
        marketCap: liveMarketData?.marketCap ?? liveMarketData?.fdv ?? null,
        volume24h: liveMarketData?.volume24h ?? null,
        accent: token.accent,
        logo: token.logo,
      };
    });
  }, [coreLiveTokens, currentAssets, prices, tokenMarketData]);

  const investmentRows = useMemo(() => {
    const ethUsdPrice = prices['ethereum']?.usd
      || prices['ethereum:native']?.usd
      || prices['pulsechain:0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c']?.usd
      || 0;
    return buildInvestmentRows(currentAssets, currentTransactions, ethUsdPrice);
  }, [currentAssets, currentTransactions, prices]);

  const swapPnl24hUsd = useMemo(() => {
    return swapTransactions24h.reduce((sum, tx) => {
      if (tx.type !== 'swap') return sum;
      const asset = currentAssets.find((candidate) => sameAssetSymbol(candidate.symbol, tx.asset, candidate.chain) && candidate.chain === tx.chain);
      const entryUsd = (tx.valueUsd ?? 0) > 0
        ? (tx.valueUsd ?? 0)
        : (tx.assetPriceUsdAtTx ?? 0) > 0
          ? tx.amount * (tx.assetPriceUsdAtTx ?? 0)
          : 0;
      if (!asset || entryUsd <= 0 || asset.price <= 0) return sum;
      return sum + ((tx.amount * asset.price) - entryUsd);
    }, 0);
  }, [currentAssets, swapTransactions24h]);

  const trackedMarketCount = useMemo(() => {
    return currentAssets.filter((asset) => asset.chain === 'pulsechain' && asset.price > 0).length;
  }, [currentAssets]);



  const frontInfoCards = useMemo(() => [
    {
      label: 'On / Offramp',
      value: 'Move money in and out',
      detail: 'Start with a tiny test. Use known routes, confirm the token contract, then scale once the bridge or swap lands.',
      action: 'Bridge safely',
      href: 'https://bridge.pulsechain.com/',
      icon: ArrowLeftRight,
    },
    {
      label: 'PulseX',
      value: 'Swap and add liquidity',
      detail: 'Use PulseX for core PulseChain swaps, then watch price, volume, liquidity, and pair depth before you size up.',
      action: 'Open PulseX',
      href: 'https://app.pulsex.com/',
      icon: Droplets,
    },
    {
      label: 'Liberty Swap',
      value: 'Stablecoin routes',
      detail: 'Good onboarding cards should explain which stablecoin path is easiest, what network it starts on, and what lands on PulseChain.',
      action: 'Compare route',
      href: null,
      icon: ArrowRight,
    },
    {
      label: 'Hyperlane',
      value: 'Extra bridge paths',
      detail: 'Useful for cross-chain assets beyond the official bridge. Keep the UI focused on route, token, fee, and arrival chain.',
      action: 'Open Hyperlane',
      href: 'https://hyperlane.xyz/',
      icon: Layers,
    },
    {
      label: 'Volume / TVL',
      value: 'Liquidity context',
      detail: 'Show 24h volume, TVL, liquidity by pair, and where depth is thin so the portfolio screen explains the market around the wallet.',
      action: 'Pulse stats',
      href: 'https://www.pulsechainstats.com/',
      icon: BarChart2,
    },
    {
      label: 'HEX staking',
      value: 'Days, yield, shares',
      detail: 'Make stake cards about days remaining, T-shares, accrued HEX, emergency end-stake risk, and current USD/PLS value.',
      action: 'View stakes',
      href: null,
      icon: Lock,
      tab: 'stakes' as ActiveTab,
    },
  ], []);

  const openMarketWatch = (initialSearch = '') => {
    setMarketWatchInitialSearch(initialSearch);
    setShowMarketWatch(true);
  };

  const runHomeSearch = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    if (/^\d+$/.test(q)) {
      window.open(`https://scan.pulsechain.com/block/${q}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (/^0x[a-fA-F0-9]{64}$/.test(q)) {
      window.open(`https://scan.pulsechain.com/tx/${q}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (/^0x[a-fA-F0-9]{40}$/.test(q)) {
      window.open(`https://scan.pulsechain.com/address/${q}`, '_blank', 'noopener,noreferrer');
      return;
    }
    openMarketWatch(q);
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Activity },
    { id: 'overview', label: 'Portfolio', icon: LayoutDashboard },
    { id: 'stakes', label: 'HEX Staking', icon: Lock },
    { id: 'pulsechain-official', label: 'My Investments', icon: Zap },
    { id: 'history', label: 'Transactions', icon: History },
    { id: 'assets', label: 'Wallets & Bridges', icon: WalletIcon },
    { id: 'wallet-analyzer', label: 'Wallet Analyzer', icon: BarChart2 },
    { id: 'defi', label: 'DeFi', icon: Droplets },
  ] as const;
  const pageMeta: Record<ActiveTab, { title: string; subtitle: string }> = {
    home: {
      title: 'Dashboard',
      subtitle: 'Current portfolio state across PulseChain, Ethereum, and Base.',
    },
    overview: {
      title: 'Portfolio',
      subtitle: 'Holdings, allocation, and performance by exact asset identity.',
    },
    stakes: {
      title: 'HEX Staking',
      subtitle: 'Liquid and staked HEX exposure across PulseChain and Ethereum.',
    },
    wallets: {
      title: 'Wallets',
      subtitle: 'Tracked wallet addresses and grouped balances.',
    },
    tracker: {
      title: 'Tracker',
      subtitle: 'Imported tracking and portfolio state.',
    },
    assets: {
      title: 'Wallets & Bridges',
      subtitle: 'Wallet-level holdings, bridge activity, and cross-chain movement.',
    },
    'pulsechain-official': {
      title: 'My Investments',
      subtitle: 'Initial capital mapped against current PulseChain ownership.',
    },
    history: {
      title: 'Transactions',
      subtitle: 'Full ledger for bridges, swaps, and cost-basis drill-down.',
    },
    'pulsechain-community': {
      title: 'Ecosystem',
      subtitle: 'PulseChain reference, contracts, bridges, and community resources.',
    },
    bridge: {
      title: 'Bridges',
      subtitle: 'Bridge routes, token references, and cross-chain operational context.',
    },
    defi: {
      title: 'DeFi',
      subtitle: 'Liquidity, farms, and protocol-level PulseChain positions.',
    },
    'wallet-analyzer': {
      title: 'Wallet Analyzer',
      subtitle: 'Analytics, investments and profit planning across all wallets.',
    },
  };
  const mobilePrimaryNavItems = navItems.filter(item => ['home', 'overview', 'history'].includes(item.id));
  const mobileMoreNavItems = navItems.filter(item => !['home', 'overview', 'history'].includes(item.id));
  const mobileMoreActive = mobileMoreNavItems.some(item => item.id === activeTab);

  return (
    <div className="app-shell min-h-screen font-sans flex" style={{ fontSize: 14, color: 'var(--fg)' }}>
      {/* -- SIDEBAR BACKDROP (mobile) -- */}
      <div className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      {/* -- SIDEBAR -- */}
      <aside style={{
          width: 208, minWidth: 208,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
        className={`app-sidebar app-sidebar-panel flex flex-col sticky top-0 h-screen${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)' }} className="flex items-center gap-2.5">
          <div style={{
            width: 34, height: 34,
            background: 'rgba(0,214,143,0.08)',
            borderRadius: 11,
            border: '1px solid rgba(0,214,143,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <img src={BRAND_ASSETS.logo} alt="Pulseport logo" style={{ width: 18, height: 18 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="app-brand-wordmark">PulsePort</span>
          </div>
        </div>

        <div className="sidebar-main-scroll custom-scrollbar">
          {/* Nav */}
          <nav style={{ padding: '8px 8px 6px' }} className="flex flex-col gap-0.5">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isDefi = id === 'defi';
              const isActive = activeTab === id;
              const defiColor = 'rgba(247,57,255,0.9)';
              const defiDim   = 'rgba(247,57,255,0.08)';
              const defiLine  = '#f739ff';
              return (
                <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                  className={`app-nav-item${isActive ? ' nav-item-active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: isActive ? (isDefi ? defiDim : 'rgba(255,255,255,0.04)') : 'transparent',
                    color: isActive ? (isDefi ? defiColor : 'var(--accent)') : 'var(--fg-muted)',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 12.5, border: '1px solid transparent', cursor: 'pointer',
                    transition: 'all .15s', width: '100%', textAlign: 'left',
                    borderLeft: isActive ? `2px solid ${isDefi ? defiLine : 'var(--accent)'}` : '2px solid transparent',
                  }}
                  onMouseOver={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg)'; } }}
                  onMouseOut={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; } }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Wallets section */}
        <div className="sidebar-wallet-zone" style={{ padding: '8px 8px 0' }}>
          <button
            onClick={() => setSidebarWalletsOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '8px 10px', borderRadius: 10,
              background: 'transparent', color: 'var(--fg-muted)',
              fontSize: 12.5, border: 'none', cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--fg-muted)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <WalletIcon size={16} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Wallets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 7px', borderRadius: 100, border: '1px solid var(--accent-border)' }}>{wallets.length}</span>
              {sidebarWalletsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>
          {sidebarWalletsOpen && (
            <div style={{ paddingBottom: 8 }}>
              {wallets.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedWalletAddr('all');
                    setActiveWallet(null);
                    setActiveTab('overview');
                    setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 8,
                    background: selectedWalletAddr === 'all' && activeWallet === null ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${selectedWalletAddr === 'all' && activeWallet === null ? 'var(--accent-border)' : 'transparent'}`,
                    color: selectedWalletAddr === 'all' && activeWallet === null ? 'var(--accent)' : 'var(--fg)',
                    cursor: 'pointer', transition: 'all .12s', marginBottom: 4,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700 }}>
                    <span className="wallet-dot wallet-dot-multi" />
                    All wallets
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--fg-subtle)', fontFamily: 'var(--font-shell-display)', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    ${currentAssets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </button>
              )}
              <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 180, padding: '2px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {wallets.map((w, wIdx) => {
                  const dotColors = ['#00FF9F','#f739ff','#627EEA','#f97316','#a855f7','#f59e0b'];
                  const isActive = selectedWalletAddr === w.address.toLowerCase() && activeTab === 'overview';
                  const walletKey = w.address.toLowerCase();
                  const walletValue = (walletAssets[walletKey] || []).reduce((sum, asset) => sum + asset.value, 0);
                  return (
                    <div key={w.address}
                      onClick={() => { setSelectedWalletAddr(w.address.toLowerCase()); setActiveWallet(w.address); setActiveTab('overview'); setSidebarOpen(false); }}
                      style={{
                        padding: '7px 10px', borderRadius: 8,
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--accent-border)' : 'transparent'}`,
                        cursor: 'pointer', transition: 'all .12s',
                      }}
                      className="group flex items-center justify-between"
                      onMouseOver={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseOut={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColors[wIdx % dotColors.length], flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <code style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{w.address.slice(0,6)}...{w.address.slice(-4)}</code>
                            <span style={{ fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--fg-subtle)', fontFamily: 'var(--font-shell-display)', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                              {walletValue > 0 ? `$${walletValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="touch-visible-actions opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingWalletAddress(w.address); setEditWalletName(w.name); }}
                          style={{ color: 'var(--fg-muted)', padding: 3, cursor: 'pointer', border: 'none', background: 'none', borderRadius: 4 }}
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--fg-muted)')}>
                          <Pencil size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeWallet(w.address); }}
                          style={{ color: 'var(--fg-muted)', padding: 3, cursor: 'pointer', border: 'none', background: 'none', borderRadius: 4 }}
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--negative)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--fg-muted)')}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {wallets.length === 0 && (
                  <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--fg-subtle)', fontStyle: 'italic' }}>No wallets added yet</div>
                )}
              </div>
              <div style={{ padding: '4px 2px 8px' }}>
                <button onClick={() => setIsAddingWallet(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 700, fontSize: 12,
                    border: '1px solid var(--accent-border)', borderRadius: 8, padding: '8px 0', cursor: 'pointer',
                    transition: 'all .15s', width: '100%',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,159,.18)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; }}>
                  <Plus size={13} /> Add Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* -- MAIN -- */}
      <main className="app-main flex-1 min-w-0 flex flex-col">
        {/* Top Nav / Header */}
        <header
          className="glass app-header shrink-0"
          style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 50,
            padding: '10px 16px',
          }}>
          <div className="app-header-main">
            <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
              <button className="sidebar-toggle md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
                <Menu size={16} />
              </button>
              <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {pageMeta[activeTab].title}
              </div>
            </div>

            <div className="app-header-actions">
              <div className="hidden sm:flex items-center gap-2">
                <div className={`status-dot ${lastUpdated ? 'status-dot-live' : ''}`} />
                {lastUpdated && (
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {timeSinceLastUpdate}s ago
                  </span>
                )}
              </div>

              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="theme-toggle"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button onClick={() => { setApiKeyInput(etherscanApiKey); setIsApiKeyModalOpen(true); }}
                title={etherscanApiKey ? 'API key set' : 'Set Etherscan API key'}
                aria-label={etherscanApiKey ? 'API key set. Open API key settings' : 'Open API key settings'}
                className="header-action-btn"
                style={etherscanApiKey ? {
                  background: 'var(--accent-dim)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--accent)',
                } : {}}>
                {etherscanApiKey ? <Check size={12} /> : <Settings size={12} />}
                <span>{etherscanApiKey ? 'API set' : 'API'}</span>
              </button>

              <button onClick={fetchPortfolio}
                className={`header-action-btn${isLoading ? ' btn-loading' : ''}`}
                style={{ color: 'var(--fg)' }}>
                <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 md:pb-0">
          <div className="app-content-shell space-y-5">

          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <HomeTab
                currentAssets={currentAssets}
                summary={summary}
                topHoldingCards={topHoldingCards}
                tokenMarketData={tokenMarketData}
                tokenLogos={tokenLogos}
                currentTransactions={currentTransactions}
                setActiveTab={setActiveTab}
                setProfitPlannerOpen={setProfitPlannerOpen}
                openMarketWatch={openMarketWatch}
                getTokenLogoUrl={getTokenLogoUrl}
              />
            )}

            {activeTab === 'overview' && (
              <OverviewTab
                wallets={wallets}
                currentAssets={currentAssets}
                currentStakes={currentStakes}
                summary={summary}
                tokenPrices={tokenPrices}
                setActiveTab={setActiveTab}
                t={t}
              />
            )}

            {activeTab === 'stakes' && (
              <StakesTab
                selectedWalletAddr={selectedWalletAddr}
              />
            )}

            {activeTab === 'defi' && (
              <motion.div key="defi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LiquiditySection
                  walletAddresses={wallets.map(w => w.address)}
                  tokenPrices={tokenPrices}
                />
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <AssetsTab
                selectedWalletAddr={selectedWalletAddr}
                currentAssets={currentAssets}
                walletAssets={walletAssets}
                currentTransactions={currentTransactions}
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                isCollapsed={isCollapsed}
                getTokenLogoUrl={getTokenLogoUrl}
                shortenAddr={shortenAddr}
                explorerUrl={explorerUrl}
                dexScreenerUrl={dexScreenerUrl}
                t={t}
                prices={prices}
                tokenLogos={tokenLogos}
                hideDust={hideDust}
                hideSpam={hideSpam}
                spamTokenIds={spamTokenIds}
                hiddenTokens={hiddenTokens}
                setHiddenTokens={setHiddenTokens}
                hideToken={hideToken}
                summary={summary}
                wallets={wallets}
                setSelectedWalletAddr={setSelectedWalletAddr}
                setActiveWallet={setActiveWallet}
                isLoading={isLoading}
                fetchPortfolio={fetchPortfolio}
                setIsAddingWallet={setIsAddingWallet}
                setEditingWalletAddress={setEditingWalletAddress}
                setEditWalletName={setEditWalletName}
                setPnlAsset={setPnlAsset}
                pnlAsset={pnlAsset}
                manualEntries={manualEntries}
                setManualEntries={setManualEntries}
                currentStakes={currentStakes}
                customCoins={customCoins}
                scanForSpam={scanForSpam}
                isScanning={isScanning}
                scanResult={scanResult}
                setIsCustomCoinsModalOpen={setIsCustomCoinsModalOpen}
                CHAIN_COLORS={CHAIN_COLORS}
                WALLET_DOT_COLORS={WALLET_DOT_COLORS}
                STATIC_LOGOS={STATIC_LOGOS}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                selectedWalletAddr={selectedWalletAddr}
                getTokenLogoUrl={getTokenLogoUrl}
                shortenAddr={shortenAddr}
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                isCollapsed={isCollapsed}
                t={t}
              />
            )}

        {activeTab === 'pulsechain-official' && (
          <motion.div key='pulsechain-official' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MyInvestmentsPage
              investedFiat={summary.netInvestment > MIN_INVESTMENT_THRESHOLD ? Math.abs(summary.netInvestment) : 0}
              currentValue={summary.totalValue}
              liquidValue={summary.liquidValue}
              stakedValue={summary.stakingValueUsd}
              plsUsdPrice={prices['pulsechain']?.usd || 0}
              rows={investmentRows}
              onOpenTransactions={(row) => {
                setActiveTab('history');
              }}
            />
          </motion.div>
        )}
        {activeTab === 'pulsechain-community' && (
          <motion.div key="pulsechain-community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PulseChainCommunityPage />
          </motion.div>
        )}

        {activeTab === 'bridge' && (
          <motion.div key="bridge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BridgeDashboardPage
              afterOfficialBridge={(
                <div className="tx-module-card received-token-module">
                  <div className="received-header tx-module-header" style={{ borderBottom: isCollapsed('received-assets') ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <ArrowDownLeft size={16} style={{ color: '#627EEA', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>MultiChain Transactions</span>
                      <select value={receivedChainFilter === 'pulsechain' ? 'all' : receivedChainFilter} onChange={e => setReceivedChainFilter(e.target.value)}
                        className="history-filter-select"
                        style={{ background: 'var(--bg-elevated)', border: `1px solid ${t.border}`, borderRadius: 6, color: 'var(--fg)', fontSize: 13, padding: '4px 8px', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">All Chains</option>
                        <option value="ethereum">Ethereum</option>
                        <option value="base">Base</option>
                      </select>
                      <select value={receivedCoinFilter} onChange={e => setReceivedCoinFilter(e.target.value)}
                        className="history-filter-select"
                        style={{ background: 'var(--bg-elevated)', border: `1px solid ${t.border}`, borderRadius: 6, color: 'var(--fg)', fontSize: 13, padding: '4px 8px', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">All Coins</option>
                        <option value="ETH">ETH</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="DAI">DAI</option>
                      </select>
                    </div>
                    <div className="received-totals" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>Total Received</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>${receivedAssetsData.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{receivedAssetsData.list.length} tx</div>
                      </div>
                      <button onClick={() => toggleSection('received-assets')}
                        style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', transition: 'color .12s', flexShrink: 0 }}
                        onMouseOver={e => (e.currentTarget.style.color = 'var(--fg)')}
                        onMouseOut={e => (e.currentTarget.style.color = 'var(--fg-subtle)')}
                        title={isCollapsed('received-assets') ? 'Expand' : 'Collapse'}>
                        {isCollapsed('received-assets') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>
                  {!isCollapsed('received-assets') && (<>
                  {receivedAssetsData.list.length > 0 && (
                    <div tabIndex={0} className="received-asset-summary-row custom-scrollbar">
                      {(Object.entries(receivedAssetsData.byAsset) as [string, { amount: number; valueUsd: number }][]).map(([sym, data]) => (
                        <div key={sym} className="received-asset-summary-card">
                          <div className="received-asset-symbol">{sym}</div>
                          <div className="received-asset-amount">
                            {sym === 'ETH' ? data.amount.toLocaleString('en-US', { maximumFractionDigits: 4 }) : data.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} {sym}
                          </div>
                          <div className="received-asset-value">${data.valueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="received-history-list custom-scrollbar tx-module-list">
                    {receivedAssetsData.list.length === 0 ? (
                      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                        {wallets.length === 0
                          ? 'Add wallets to see received assets history.'
                          : ['ethereum', 'base'].includes(receivedChainFilter === 'pulsechain' ? 'all' : receivedChainFilter) && !etherscanApiKey
                          ? <span>
                              No Ethereum/Base transactions loaded.{' '}
                              <button
                                onClick={() => { setApiKeyInput(''); setIsApiKeyModalOpen(true); }}
                                style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13, padding: 0 }}>
                                Add an Etherscan API key
                              </button>
                              {' '}for reliable ETH/Base history.
                            </span>
                          : 'No ETH or stablecoin inbound transfers found since 2021.'}
                      </div>
                    ) : (
                      <TransactionList
                        transactions={receivedAssetsData.list.map(tx => {
                          const assetUp = tx.asset.toUpperCase();
                          const isEth = assetUp === 'ETH';
                          const isPls = assetUp === 'PLS';
                          const pulseDaiPrice = prices['pulsechain:0xefd766ccb38eaf1dfd701853bfce31359239f305']?.usd
                            ?? prices['pulsechain:0x6b175474e89094c44da98b954eedeac495271d0f']?.usd
                            ?? prices['pulsechain:dai']?.usd
                            ?? 0;
                          const daiPrice = tx.chain === 'pulsechain' ? pulseDaiPrice : (prices['dai']?.usd ?? 0);
                          const usdtPrice = tx.chain === 'pulsechain'
                            ? (prices['pulsechain:0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f']?.usd ?? 0)
                            : (prices['tether']?.usd ?? 1);
                          const usdcPrice = tx.chain === 'pulsechain'
                            ? (prices['pulsechain:0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07']?.usd ?? 0)
                            : (prices['usd-coin']?.usd ?? 1);
                          const displayUsd = tx.valueUsd || (
                            isEth ? tx.amount * (prices['ethereum']?.usd || 3400) :
                            isPls ? tx.amount * (prices['pulsechain']?.usd || 0.00005) :
                            assetUp.includes('USDT') || assetUp.includes('TETHER') ? tx.amount * usdtPrice :
                            assetUp.includes('DAI') ? tx.amount * daiPrice :
                            tx.amount * usdcPrice
                          );
                          return { ...tx, valueUsd: displayUsd };
                        })}
                        viewAsYou={false}
                        wallets={wallets}
                        assets={currentAssets}
                        getTokenLogoUrl={getTokenLogoUrl}
                        tokenLogos={tokenLogos}
                        hideIds={hiddenTxIds}
                        onToggleHide={handleToggleHide}
                        showHidden={false}
                        emptyMessage="No received token transactions found."
                      />
                    )}
                  </div>
                  </>)}
                </div>
              )}
            />
          </motion.div>
        )}

        {activeTab === 'wallets' && (
          <WalletsTab
            wallets={wallets}
            selectedWalletAddr={selectedWalletAddr}
            onSelectWallet={setSelectedWalletAddr}
            onRemoveWallet={removeWallet}
            onOpenAddWallet={() => setIsAddingWallet(true)}
            onOpenEditWallet={(addr, name) => {
              setEditingWalletAddress(addr);
              setEditWalletName(name);
            }}
            t={t}
            WALLET_DOT_COLORS={WALLET_DOT_COLORS}
          />
        )}

        {activeTab === 'wallet-analyzer' && (
          <motion.div key="wallet-analyzer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WalletAnalyzer
              assets={currentAssets}
              history={history}
              transactions={transactions}
              investmentRows={investmentRows}
              investedFiat={summary.netInvestment > MIN_INVESTMENT_THRESHOLD ? Math.abs(summary.netInvestment) : 0}
              currentValue={summary.totalValue}
              liquidValue={summary.liquidValue}
              stakedValue={summary.stakingValueUsd}
              plsUsdPrice={prices['pulsechain']?.usd || 0}
              onOpenTransactions={(row) => {
                setActiveTab('history');
              }}
            />
          </motion.div>
        )}

              </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="border-t border-white/5 py-6 px-8 text-center text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
            PulsePort &copy; 2026 &bull; Powered by PulseChain, Ethereum &amp; Base
          </footer>
        </div>
      </main>

      {/* -- MOBILE BOTTOM NAV -- */}
      <nav className="mobile-bottom-nav bottom-nav-blur md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--bg-header)',
          borderTop: '1px solid var(--border)',
        }}>
        <div className={`mobile-more-sheet${mobileMoreOpen ? ' is-open' : ''}`}>
          {mobileMoreNavItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`mobile-more-link${activeTab === id ? ' is-active' : ''}`}
              onClick={() => {
                setActiveTab(id);
                setMobileMoreOpen(false);
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="mobile-bottom-nav-inner">
        {mobilePrimaryNavItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setActiveTab(id); setMobileMoreOpen(false); }}
            className="mobile-nav-tab-btn"
            style={{
              color: activeTab === id ? 'var(--accent)' : 'var(--fg-muted)',
            }}>
            <div className={activeTab === id ? 'bottom-nav-dot' : ''}>
              <Icon size={19} />
            </div>
            <span style={{ fontSize: 9, fontWeight: activeTab === id ? 700 : 500, lineHeight: 1, marginTop: 3 }}>{label}</span>
          </button>
        ))}
          <button
            type="button"
            onClick={() => setMobileMoreOpen(v => !v)}
            className="mobile-nav-tab-btn"
            style={{
              color: mobileMoreOpen || mobileMoreActive ? 'var(--accent)' : 'var(--fg-muted)',
            }}
          >
            <div className={mobileMoreOpen || mobileMoreActive ? 'bottom-nav-dot' : ''}>
              <Layers size={19} />
            </div>
            <span style={{ fontSize: 9, fontWeight: mobileMoreOpen || mobileMoreActive ? 700 : 500, lineHeight: 1, marginTop: 3 }}>More</span>
          </button>
        </div>
      </nav>

      {/* -- MODALS -- */}
      <AppModals
        isAddingWallet={isAddingWallet}
        setIsAddingWallet={setIsAddingWallet}
        newWalletAddress={newWalletAddress}
        setNewWalletAddress={setNewWalletAddress}
        newWalletName={newWalletName}
        setNewWalletName={setNewWalletName}
        walletFormError={walletFormError}
        setWalletFormError={setWalletFormError}
        addWallet={addWallet}
        editingWalletAddress={editingWalletAddress}
        setEditingWalletAddress={setEditingWalletAddress}
        editWalletName={editWalletName}
        setEditWalletName={setEditWalletName}
        renameWallet={renameWallet}
        isCustomCoinsModalOpen={isCustomCoinsModalOpen}
        setIsCustomCoinsModalOpen={setIsCustomCoinsModalOpen}
        customCoinDraft={customCoinDraft}
        setCustomCoinDraft={setCustomCoinDraft}
        submitCustomCoin={submitCustomCoin}
        showMarketWatch={showMarketWatch}
        setShowMarketWatch={setShowMarketWatch}
        marketWatchInitialSearch={marketWatchInitialSearch}
        theme={theme}
        profitPlannerOpen={profitPlannerOpen}
        setProfitPlannerOpen={setProfitPlannerOpen}
        currentAssets={currentAssets}
        summary={summary}
        isApiKeyModalOpen={isApiKeyModalOpen}
        setIsApiKeyModalOpen={setIsApiKeyModalOpen}
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        etherscanApiKey={etherscanApiKey}
        setEtherscanApiKey={setEtherscanApiKey}
        fetchPortfolio={fetchPortfolio}
        pnlAsset={pnlAsset}
        setPnlAsset={setPnlAsset}
        currentTransactions={currentTransactions}
        prices={prices}
        tokenLogos={tokenLogos}
        STATIC_LOGOS={STATIC_LOGOS}
        selectedWalletAddr={selectedWalletAddr}
        getTokenLogoUrl={getTokenLogoUrl}
        tokenCardModal={tokenCardModal}
        setTokenCardModal={setTokenCardModal}
        tokenCardModalLoading={tokenCardModalLoading}
        tokenMarketData={tokenMarketData}
        dexScreenerUrl={dexScreenerUrl}
        explorerUrl={explorerUrl}
        t={t}
      />

    </div>
  );
}
