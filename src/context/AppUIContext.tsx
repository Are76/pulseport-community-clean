import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { readStoredJSON } from '../utils/appHelpers';
import type { Asset } from '../types';

interface AppUIState {
  activeTab: string;
  sidebarOpen: boolean;
  mobileMoreOpen: boolean;
  mobileHistoryOpen: boolean;
  selectedInvestment: string | null;
  selectedStake: string | null;
  selectedLpPosition: string | null;
  selectedFarmPosition: string | null;
  priceCardFilter: string;
  priceCardSearch: string;
  showDustFilter: boolean;
  yieldUnit: 'hex' | 'usd';
  priceChartPeriod: string;
  gainLossView: 'absolute' | 'percentage';
}

interface AppUIContextType extends AppUIState {
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMoreOpen: (open: boolean) => void;
  setMobileHistoryOpen: (open: boolean) => void;
  setSelectedInvestment: (id: string | null) => void;
  setSelectedStake: (id: string | null) => void;
  setSelectedLpPosition: (id: string | null) => void;
  setSelectedFarmPosition: (id: string | null) => void;
  setPriceCardFilter: (filter: string) => void;
  setPriceCardSearch: (search: string) => void;
  setShowDustFilter: (show: boolean) => void;
  setYieldUnit: (unit: 'hex' | 'usd') => void;
  setPriceChartPeriod: (period: string) => void;
  setGainLossView: (view: 'absolute' | 'percentage') => void;
}

const AppUIContext = createContext<AppUIContextType | undefined>(undefined);

export function AppUIProvider({ children }: { children: ReactNode }) {
  // Load persisted state from localStorage
  const storedActiveTab = readStoredJSON<string>('pulseport_active_tab', 'overview');
  const storedYieldUnit = readStoredJSON<'hex' | 'usd'>('pulseport_yield_unit', 'usd');

  const [activeTab, setActiveTab] = useState(storedActiveTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);
  const [selectedStake, setSelectedStake] = useState<string | null>(null);
  const [selectedLpPosition, setSelectedLpPosition] = useState<string | null>(null);
  const [selectedFarmPosition, setSelectedFarmPosition] = useState<string | null>(null);
  const [priceCardFilter, setPriceCardFilter] = useState('all');
  const [priceCardSearch, setPriceCardSearch] = useState('');
  const [showDustFilter, setShowDustFilter] = useState(false);
  const [yieldUnit, setYieldUnit] = useState<'hex' | 'usd'>(storedYieldUnit);
  const [priceChartPeriod, setPriceChartPeriod] = useState('1d');
  const [gainLossView, setGainLossView] = useState<'absolute' | 'percentage'>('percentage');

  // Persist activeTab when it changes
  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('pulseport_active_tab', JSON.stringify(tab));
  }, []);

  // Persist yieldUnit when it changes
  const handleSetYieldUnit = useCallback((unit: 'hex' | 'usd') => {
    setYieldUnit(unit);
    localStorage.setItem('pulseport_yield_unit', JSON.stringify(unit));
  }, []);

  const value: AppUIContextType = {
    activeTab,
    sidebarOpen,
    mobileMoreOpen,
    mobileHistoryOpen,
    selectedInvestment,
    selectedStake,
    selectedLpPosition,
    selectedFarmPosition,
    priceCardFilter,
    priceCardSearch,
    showDustFilter,
    yieldUnit,
    priceChartPeriod,
    gainLossView,
    setActiveTab: handleSetActiveTab,
    setSidebarOpen,
    setMobileMoreOpen,
    setMobileHistoryOpen,
    setSelectedInvestment,
    setSelectedStake,
    setSelectedLpPosition,
    setSelectedFarmPosition,
    setPriceCardFilter,
    setPriceCardSearch,
    setShowDustFilter,
    setYieldUnit: handleSetYieldUnit,
    setPriceChartPeriod,
    setGainLossView,
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
