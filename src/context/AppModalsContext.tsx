import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppModalsState {
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
}

interface AppModalsContextType extends AppModalsState {
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

const AppModalsContext = createContext<AppModalsContextType | undefined>(undefined);

export function AppModalsProvider({ children }: { children: ReactNode }) {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showRemoveWallet, setShowRemoveWallet] = useState(false);
  const [showMarketWatch, setShowMarketWatch] = useState(false);
  const [showPriceCard, setShowPriceCard] = useState(false);
  const [showInvestmentDetail, setShowInvestmentDetail] = useState(false);
  const [showStakeDetail, setShowStakeDetail] = useState(false);
  const [showLpDetail, setShowLpDetail] = useState(false);
  const [showFarmDetail, setShowFarmDetail] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [selectedModalId, setSelectedModalId] = useState<string | null>(null);
  const [confirmActionMessage, setConfirmActionMessage] = useState('');
  const [confirmActionCallback, setConfirmActionCallback] = useState<(() => void) | null>(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const value: AppModalsContextType = {
    showAddWallet,
    showRemoveWallet,
    showMarketWatch,
    showPriceCard,
    showInvestmentDetail,
    showStakeDetail,
    showLpDetail,
    showFarmDetail,
    showConfirmAction,
    showSettings,
    showHelp,
    showAbout,
    selectedModalId,
    confirmActionMessage,
    confirmActionCallback,
    isLoadingModal,
    modalError,
    setShowAddWallet,
    setShowRemoveWallet,
    setShowMarketWatch,
    setShowPriceCard,
    setShowInvestmentDetail,
    setShowStakeDetail,
    setShowLpDetail,
    setShowFarmDetail,
    setShowConfirmAction,
    setShowSettings,
    setShowHelp,
    setShowAbout,
    setSelectedModalId,
    setConfirmActionMessage,
    setConfirmActionCallback,
    setIsLoadingModal,
    setModalError,
  };

  return (
    <AppModalsContext.Provider value={value}>
      {children}
    </AppModalsContext.Provider>
  );
}

export function useAppModals(): AppModalsContextType {
  const context = useContext(AppModalsContext);
  if (!context) {
    throw new Error('useAppModals must be used within an AppModalsProvider');
  }
  return context;
}
