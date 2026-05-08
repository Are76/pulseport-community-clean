import React, { createContext, useContext, ReactNode } from 'react';
import { useModalState } from '../hooks/useModalState';

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
  const modalState = useModalState();

  const value: AppModalsContextType = {
    showAddWallet: modalState.isModalOpen('addWallet'),
    showRemoveWallet: modalState.isModalOpen('removeWallet'),
    showMarketWatch: modalState.isModalOpen('marketWatch'),
    showPriceCard: modalState.isModalOpen('priceCard'),
    showInvestmentDetail: modalState.isModalOpen('investmentDetail'),
    showStakeDetail: modalState.isModalOpen('stakeDetail'),
    showLpDetail: modalState.isModalOpen('lpDetail'),
    showFarmDetail: modalState.isModalOpen('farmDetail'),
    showConfirmAction: modalState.isModalOpen('confirmAction'),
    showSettings: modalState.isModalOpen('settings'),
    showHelp: modalState.isModalOpen('help'),
    showAbout: modalState.isModalOpen('about'),
    selectedModalId: modalState.selectedModalId,
    confirmActionMessage: modalState.confirmActionMessage,
    confirmActionCallback: modalState.confirmActionCallback,
    isLoadingModal: modalState.isLoadingModal,
    modalError: modalState.modalError,
    setShowAddWallet: (show: boolean) => show ? modalState.openModalAction('addWallet') : modalState.closeModal(),
    setShowRemoveWallet: (show: boolean) => show ? modalState.openModalAction('removeWallet') : modalState.closeModal(),
    setShowMarketWatch: (show: boolean) => show ? modalState.openModalAction('marketWatch') : modalState.closeModal(),
    setShowPriceCard: (show: boolean) => show ? modalState.openModalAction('priceCard') : modalState.closeModal(),
    setShowInvestmentDetail: (show: boolean) => show ? modalState.openModalAction('investmentDetail') : modalState.closeModal(),
    setShowStakeDetail: (show: boolean) => show ? modalState.openModalAction('stakeDetail') : modalState.closeModal(),
    setShowLpDetail: (show: boolean) => show ? modalState.openModalAction('lpDetail') : modalState.closeModal(),
    setShowFarmDetail: (show: boolean) => show ? modalState.openModalAction('farmDetail') : modalState.closeModal(),
    setShowConfirmAction: (show: boolean) => show ? modalState.openModalAction('confirmAction') : modalState.closeModal(),
    setShowSettings: (show: boolean) => show ? modalState.openModalAction('settings') : modalState.closeModal(),
    setShowHelp: (show: boolean) => show ? modalState.openModalAction('help') : modalState.closeModal(),
    setShowAbout: (show: boolean) => show ? modalState.openModalAction('about') : modalState.closeModal(),
    setSelectedModalId: modalState.setSelectedModalId,
    setConfirmActionMessage: modalState.setConfirmActionMessage,
    setConfirmActionCallback: modalState.setConfirmActionCallback,
    setIsLoadingModal: modalState.setIsLoadingModal,
    setModalError: modalState.setModalError,
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
