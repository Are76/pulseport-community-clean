import React, { useState, useMemo } from 'react';
import { Plus, Zap } from 'lucide-react';
import { CoinList, type CoinData } from '../components/wallet-holdings/CoinList';
import { CoinFilters } from '../components/wallet-holdings/CoinFilters';
import { AddCoinModal } from '../components/wallet-holdings/AddCoinModal';
import { ScanSpamModal } from '../components/wallet-holdings/ScanSpamModal';
import type { Asset, Wallet } from '../types';

interface WalletHoldingsPageProps {
  assets: Asset[];
  wallets: Wallet[];
  selectedWalletAddr: string;
  onSelectWallet: (address: string) => void;
  hiddenTokens: string[];
  onHideToken: (id: string) => void;
  onRemoveToken: (id: string) => void;
  isScanning: boolean;
  scanResult: number | null;
  onScan: () => void;
  onAddCoin?: (asset: Asset) => void;
}

export function WalletHoldingsPage({
  assets,
  wallets,
  selectedWalletAddr,
  onSelectWallet,
  hiddenTokens,
  onHideToken,
  onRemoveToken,
  isScanning,
  scanResult,
  onScan,
  onAddCoin = () => {},
}: WalletHoldingsPageProps) {
  const [showHiddenCoins, setShowHiddenCoins] = useState(false);
  const [showDustFilter, setShowDustFilter] = useState(true);
  const [isAddCoinModalOpen, setIsAddCoinModalOpen] = useState(false);
  const [isScanSpamModalOpen, setIsScanSpamModalOpen] = useState(false);

  // Convert assets to CoinData format
  const coins = useMemo<CoinData[]>(
    () =>
      assets.map((asset) => ({
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        balance: asset.balance,
        value: asset.value,
        price: asset.price,
        chain: asset.chain,
        isHidden: hiddenTokens.includes(asset.id),
        logoUrl: asset.logoUrl,
      })),
    [assets, hiddenTokens]
  );

  // Calculate totals
  const { totalValue, visibleValue, dustCount, hiddenCount } = useMemo(() => {
    const total = coins.reduce((sum, coin) => sum + coin.value, 0);
    const visible = coins
      .filter((coin) => !coin.isHidden && !(showDustFilter && coin.value < 10))
      .reduce((sum, coin) => sum + coin.value, 0);
    const dust = coins.filter((coin) => coin.value < 10).length;
    const hidden = hiddenTokens.length;

    return {
      totalValue: total,
      visibleValue: visible,
      dustCount: dust,
      hiddenCount: hidden,
    };
  }, [coins, hiddenTokens, showDustFilter]);

  const handleAddCoin = (coinData: {
    symbol: string;
    name: string;
    chain: string;
    contractAddress: string;
  }) => {
    const newAsset: Asset = {
      id: `${coinData.chain}:${coinData.contractAddress}`,
      symbol: coinData.symbol,
      name: coinData.name,
      address: coinData.contractAddress,
      balance: 0,
      price: 0,
      value: 0,
      chain: coinData.chain as any,
    };
    onAddCoin(newAsset);
  };

  const handleScanSpam = () => {
    setIsScanSpamModalOpen(true);
    onScan();
  };

  const handleRemoveSpam = () => {
    setIsScanSpamModalOpen(false);
  };

  const formatValue = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wallet Holdings
          </h1>
          <p className="text-gray-600">
            Manage your coin holdings, visibility, and portfolio composition
          </p>
        </div>

        {/* Wallet Selector */}
        {wallets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Wallet
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelectWallet('')}
                className={`px-4 py-2 rounded-lg border transition-colors filter-pill ${
                  selectedWalletAddr === ''
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Wallets
              </button>
              {wallets.map((wallet) => (
                <button
                  key={wallet.address}
                  onClick={() => onSelectWallet(wallet.address)}
                  className={`px-4 py-2 rounded-lg border transition-colors filter-pill ${
                    selectedWalletAddr === wallet.address
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {wallet.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatValue(totalValue)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">
              Visible Value
              {showDustFilter && ' (excluding dust)'}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatValue(visibleValue)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Holdings Count</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {coins.length}
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Coins</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsAddCoinModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={18} />
                Add Coin
              </button>
              <button
                onClick={handleScanSpam}
                className="flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Zap size={18} />
                Scan Spam
              </button>
            </div>
          </div>

          <CoinFilters
            showHiddenCoins={showHiddenCoins}
            onToggleHidden={() => setShowHiddenCoins(!showHiddenCoins)}
            showDustFilter={showDustFilter}
            onToggleDustFilter={() => setShowDustFilter(!showDustFilter)}
            hiddenCount={hiddenCount}
            dustCount={dustCount}
          />
        </div>

        {/* Coin List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CoinList
            coins={coins}
            hiddenCoins={hiddenTokens}
            showDust={showDustFilter}
            onHideToggle={onHideToken}
            onRemove={onRemoveToken}
          />
        </div>

        {/* Modals */}
        <AddCoinModal
          isOpen={isAddCoinModalOpen}
          onClose={() => setIsAddCoinModalOpen(false)}
          onAdd={handleAddCoin}
        />

        <ScanSpamModal
          isOpen={isScanSpamModalOpen}
          onClose={() => setIsScanSpamModalOpen(false)}
          isScanning={isScanning}
          scanResult={scanResult}
          onConfirmRemove={handleRemoveSpam}
        />
      </div>
    </div>
  );
}
