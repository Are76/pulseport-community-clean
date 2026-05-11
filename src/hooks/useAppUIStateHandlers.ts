import { useState, useCallback } from 'react';
import type { Wallet } from '../types';
import { getAddress } from 'viem';

/**
 * Manages all wallet-level UI interaction state (add/remove/rename wallets, form fields).
 * @returns State values and callbacks for the wallet management UI.
 */
export function useAppUIStateHandlers() {
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
  const [selectedWalletAddr, setSelectedWalletAddr] = useState('all');
  const [sidebarWalletsOpen, setSidebarWalletsOpen] = useState(false);
  const [tokenCardModal, setTokenCardModal] = useState<any>(null);
  const [tokenCardModalLoading, setTokenCardModalLoading] = useState(false);
  const [pnlAsset, setPnlAsset] = useState<any>(null);
  const [selectedBridgeTxId, setSelectedBridgeTxId] = useState<string | null>(null);
  const [profitPlannerOpen, setProfitPlannerOpen] = useState(false);
  const [showReceivedAssets, setShowReceivedAssets] = useState(true);
  const [showRecentActivity, setShowRecentActivity] = useState(true);

  const addWallet = useCallback((wallets: Wallet[], customCoins: any[]) => {
    const normalizedInput = newWalletAddress.trim();
    let checksummedAddress = '';

    try {
      checksummedAddress = getAddress(normalizedInput);
    } catch {
      setWalletFormError('Enter a valid EVM wallet address (0x...).');
      return false;
    }

    if (wallets.some(w => w.address.toLowerCase() === checksummedAddress.toLowerCase())) {
      setWalletFormError('This wallet has already been added.');
      return false;
    }

    const trimmedName = newWalletName.trim();
    const newWallet: Wallet = {
      address: checksummedAddress,
      name: trimmedName || `Wallet ${wallets.length + 1}`
    };

    setNewWalletAddress('');
    setNewWalletName('');
    setWalletFormError('');
    setIsAddingWallet(false);

    return { newWallet, checksummedAddress };
  }, [newWalletAddress, newWalletName]);

  const renameWallet = useCallback((address: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setEditingWalletAddress(null);
    return trimmed;
  }, []);

  const submitCustomCoin = useCallback(() => {
    const symbol = customCoinDraft.symbol.trim().toUpperCase();
    const name = customCoinDraft.name.trim() || symbol;
    const balance = Number(customCoinDraft.balance);
    const price = Number(customCoinDraft.price || 0);
    if (!symbol || !Number.isFinite(balance) || balance <= 0 || !Number.isFinite(price) || price < 0) return false;

    const newCoin = { symbol, name, balance, price, id: Math.random().toString(36).substr(2, 9) };
    setCustomCoinDraft({ symbol: '', name: '', balance: '', price: '' });
    setIsCustomCoinsModalOpen(false);

    return newCoin;
  }, [customCoinDraft]);

  return {
    // Wallet state
    newWalletAddress, setNewWalletAddress,
    newWalletName, setNewWalletName,
    walletFormError, setWalletFormError,
    isAddingWallet, setIsAddingWallet,
    editingWalletAddress, setEditingWalletAddress,
    editWalletName, setEditWalletName,
    addWallet,
    renameWallet,

    // Custom coins state
    isCustomCoinsModalOpen, setIsCustomCoinsModalOpen,
    customCoinDraft, setCustomCoinDraft,
    submitCustomCoin,

    // Filters
    receivedCoinFilter, setReceivedCoinFilter,
    receivedChainFilter, setReceivedChainFilter,

    // Time tracking
    timeSinceLastUpdate, setTimeSinceLastUpdate,

    // Market watch state
    marketWatchInitialSearch, setMarketWatchInitialSearch,
    isApiKeyModalOpen, setIsApiKeyModalOpen,
    apiKeyInput, setApiKeyInput,

    // Active wallet tracking
    activeWallet, setActiveWallet,
    selectedWalletAddr, setSelectedWalletAddr,
    sidebarWalletsOpen, setSidebarWalletsOpen,

    // Token card modal
    tokenCardModal, setTokenCardModal,
    tokenCardModalLoading, setTokenCardModalLoading,

    // PnL and planning
    pnlAsset, setPnlAsset,
    selectedBridgeTxId, setSelectedBridgeTxId,
    profitPlannerOpen, setProfitPlannerOpen,

    // Asset visibility
    showReceivedAssets, setShowReceivedAssets,
    showRecentActivity, setShowRecentActivity,
  };
}
