import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { readStoredJSON } from '../utils/appHelpers';
import type { Asset } from '../types';

interface AppUIState {
  activeTab: string;
  sidebarOpen: boolean;
  sidebarWalletsOpen: boolean;
  mobileMoreOpen: boolean;
  selectedWalletAddr: string;
  priceDisplayCurrency: 'usd' | 'pls';
  yieldUnit: 'hex' | 'usd';
  showMarketWatch: boolean;
  tokenCardModal: Asset | null;
  tokenCardModalLoading: boolean;
}

interface AppUIContextType extends AppUIState {
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWalletsOpen: (open: boolean) => void;
  setMobileMoreOpen: (open: boolean) => void;
  setSelectedWalletAddr: (addr: string) => void;
  setPriceDisplayCurrency: (currency: 'usd' | 'pls') => void;
  setYieldUnit: (unit: 'hex' | 'usd') => void;
  setShowMarketWatch: (show: boolean) => void;
  setTokenCardModal: (asset: Asset | null) => void;
  setTokenCardModalLoading: (loading: boolean) => void;
}

const AppUIContext = createContext<AppUIContextType | undefined>(undefined);

export function AppUIProvider({ children }: { children: ReactNode }) {
  // Load persisted state from localStorage
  const storedYieldUnit = readStoredJSON<'hex' | 'usd'>('pulseport_yield_unit', 'usd');

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWalletsOpen, setSidebarWalletsOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [selectedWalletAddr, setSelectedWalletAddr] = useState<string>('all');
  const [priceDisplayCurrency, setPriceDisplayCurrency] = useState<'usd' | 'pls'>('usd');
  const [yieldUnit, setYieldUnit] = useState<'hex' | 'usd'>(storedYieldUnit);
  const [showMarketWatch, setShowMarketWatch] = useState(false);
  const [tokenCardModal, setTokenCardModal] = useState<Asset | null>(null);
  const [tokenCardModalLoading, setTokenCardModalLoading] = useState(false);

  // Persist yieldUnit when it changes
  const handleSetYieldUnit = useCallback((unit: 'hex' | 'usd') => {
    setYieldUnit(unit);
    localStorage.setItem('pulseport_yield_unit', JSON.stringify(unit));
  }, []);

  // Persist activeTab when it changes
  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    const ACTIVE_TAB_STORAGE_KEY = 'pulseport_active_tab';
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  }, []);

  const value: AppUIContextType = {
    activeTab,
    sidebarOpen,
    sidebarWalletsOpen,
    mobileMoreOpen,
    selectedWalletAddr,
    priceDisplayCurrency,
    yieldUnit,
    showMarketWatch,
    tokenCardModal,
    tokenCardModalLoading,
    setActiveTab: handleSetActiveTab,
    setSidebarOpen,
    setSidebarWalletsOpen,
    setMobileMoreOpen,
    setSelectedWalletAddr,
    setPriceDisplayCurrency,
    setYieldUnit: handleSetYieldUnit,
    setShowMarketWatch,
    setTokenCardModal,
    setTokenCardModalLoading,
  };

  return (
    <AppUIContext.Provider value={value}>
      {children}
    </AppUIContext.Provider>
  );
}

export function useAppUI(): AppUIContextType {
  const context = useContext(AppUIContext);
  if (!context) {
    throw new Error('useAppUI must be used within an AppUIProvider');
  }
  return context;
}
