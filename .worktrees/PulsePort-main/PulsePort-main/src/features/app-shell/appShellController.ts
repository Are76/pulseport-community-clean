import {
  Activity,
  Droplets,
  History,
  LayoutDashboard,
  Lock,
  Zap,
} from 'lucide-react';
import type { AppShellNavigationGroup } from '../../components/dashboard-shell';

export type ActiveTab =
  | 'home'
  | 'overview'
  | 'assets'
  | 'stakes'
  | 'history'
  | 'tracker'
  | 'wallets'
  | 'wallet-analyzer'
  | 'defi'
  | 'pulsechain-official'
  | 'pulsechain-community'
  | 'bridge';

export type AppShellNavItem = {
  id: ActiveTab;
  label: string;
  icon: typeof Activity;
};

export const ACTIVE_TAB_STORAGE_KEY = 'pulseport_active_tab';

const ACTIVE_TABS: ActiveTab[] = [
  'home',
  'overview',
  'assets',
  'stakes',
  'history',
  'tracker',
  'wallet-analyzer',
  'defi',
  'pulsechain-official',
  'pulsechain-community',
  'bridge',
];

export const APP_SHELL_NAV_ITEMS: AppShellNavItem[] = [
  { id: 'home', label: 'Dashboard', icon: Activity },
  { id: 'overview', label: 'Portfolio', icon: LayoutDashboard },
  { id: 'stakes', label: 'HEX Staking', icon: Lock },
  { id: 'wallet-analyzer', label: 'Wallet Analyzer', icon: Zap },
  { id: 'pulsechain-official', label: 'My Investments', icon: Zap },
  { id: 'history', label: 'Transactions', icon: History },
  { id: 'defi', label: 'DeFi', icon: Droplets },
];

export const APP_SHELL_NAV_GROUPS: AppShellNavigationGroup[] = [
  {
    label: 'Portfolio',
    items: APP_SHELL_NAV_ITEMS.filter(item => ['home', 'overview', 'stakes'].includes(item.id)),
  },
  {
    label: 'Operations',
    items: APP_SHELL_NAV_ITEMS.filter(item => ['wallet-analyzer', 'pulsechain-official', 'history', 'defi'].includes(item.id)),
  },
];

export const APP_SHELL_PAGE_META: Record<ActiveTab, { title: string; subtitle: string }> = {
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
  'wallet-analyzer': {
    title: 'Wallet Analyzer',
    subtitle: 'Executive capital readout, recent flows, and next actions by wallet exposure.',
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
};

const MOBILE_PRIMARY_NAV_IDS: ActiveTab[] = ['home', 'overview', 'history'];

export function readStoredActiveTab(): ActiveTab {
  if (typeof window === 'undefined') return 'home';
  const saved = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  if (saved === 'wallets') return 'assets';
  return ACTIVE_TABS.includes(saved as ActiveTab) ? (saved as ActiveTab) : 'home';
}

export function getMobileAppShellNav(activeTab: ActiveTab) {
  const primaryItems = APP_SHELL_NAV_ITEMS.filter(item => MOBILE_PRIMARY_NAV_IDS.includes(item.id));
  const moreItems = APP_SHELL_NAV_ITEMS.filter(item => !MOBILE_PRIMARY_NAV_IDS.includes(item.id));

  return {
    primaryItems,
    moreItems,
    moreActive: moreItems.some(item => item.id === activeTab),
  };
}
