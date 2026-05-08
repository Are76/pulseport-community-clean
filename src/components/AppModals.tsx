import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Plus, Settings, ExternalLink } from 'lucide-react';
import { Asset } from '../types';
import { PnLModal } from './PnLModal';
import { TokenCardModal } from './TokenCardModal';
import { MarketWatchModal } from './MarketWatchModal';
import { ProfitPlannerModal } from './ProfitPlannerModal';
import { AddCoinModal } from './AddCoinModal';

interface AppModalsProps {
  // Wallet modals
  isAddingWallet: boolean;
  setIsAddingWallet: (val: boolean) => void;
  newWalletAddress: string;
  setNewWalletAddress: (val: string) => void;
  newWalletName: string;
  setNewWalletName: (val: string) => void;
  walletFormError: string;
  setWalletFormError: (val: string) => void;
  addWallet: () => void;

  editingWalletAddress: string | null;
  setEditingWalletAddress: (val: string | null) => void;
  editWalletName: string;
  setEditWalletName: (val: string) => void;
  renameWallet: (addr: string, name: string) => void;

  // Custom coins
  isCustomCoinsModalOpen: boolean;
  setIsCustomCoinsModalOpen: (val: boolean) => void;
  customCoinDraft: { symbol: string; name: string; balance: string; price: string };
  setCustomCoinDraft: (val: any) => void;
  submitCustomCoin: () => void;

  // Market watch
  showMarketWatch: boolean;
  setShowMarketWatch: (val: boolean) => void;
  marketWatchInitialSearch: string;
  theme: 'dark' | 'light';

  // Profit planner
  profitPlannerOpen: boolean;
  setProfitPlannerOpen: (val: boolean) => void;
  currentAssets: Asset[];
  summary: { totalValue: number };

  // API key
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (val: boolean) => void;
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  etherscanApiKey: string;
  setEtherscanApiKey: (val: string) => void;
  fetchPortfolio: () => void;

  // P&L Modal
  pnlAsset: Asset | null;
  setPnlAsset: (val: Asset | null) => void;
  currentTransactions: any[];
  prices: Record<string, any>;
  tokenLogos: Record<string, string>;
  STATIC_LOGOS: Record<string, string>;
  selectedWalletAddr: string;
  getTokenLogoUrl: (asset: Asset) => string;

  // Token card modal
  tokenCardModal: Asset | null;
  setTokenCardModal: (val: Asset | null) => void;
  tokenCardModalLoading: boolean;
  tokenMarketData: Record<string, any>;
  dexScreenerUrl: (chain: string, address: string) => string;
  explorerUrl: (chain: string, address: string) => string | null;

  // Theme
  t: { border: string; textMuted: string; text: string };
}

export function AppModals({
  isAddingWallet, setIsAddingWallet, newWalletAddress, setNewWalletAddress,
  newWalletName, setNewWalletName, walletFormError, setWalletFormError, addWallet,
  editingWalletAddress, setEditingWalletAddress, editWalletName, setEditWalletName, renameWallet,
  isCustomCoinsModalOpen, setIsCustomCoinsModalOpen, customCoinDraft, setCustomCoinDraft, submitCustomCoin,
  showMarketWatch, setShowMarketWatch, marketWatchInitialSearch, theme,
  profitPlannerOpen, setProfitPlannerOpen, currentAssets, summary,
  isApiKeyModalOpen, setIsApiKeyModalOpen, apiKeyInput, setApiKeyInput, etherscanApiKey, setEtherscanApiKey, fetchPortfolio,
  pnlAsset, setPnlAsset, currentTransactions, prices, tokenLogos, STATIC_LOGOS, selectedWalletAddr, getTokenLogoUrl,
  tokenCardModal, setTokenCardModal, tokenCardModalLoading, tokenMarketData, dexScreenerUrl, explorerUrl,
  t,
}: AppModalsProps) {
  return (
    <>
      {/* Add Wallet Modal */}
      <AnimatePresence>
        {isAddingWallet && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingWallet(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 90 }}
              className="wallet-modal-panel sm:rounded-[20px]"
            >
              <div className="sm:hidden" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border }} />
              </div>
              <div className="wallet-modal-head">
                <span>Wallet Intake</span>
                <h2>Track A New Wallet</h2>
                <p>Paste any public EVM address once. PulsePort reads balances, transactions, and attribution without ever touching private keys.</p>
              </div>
              <div className="wallet-modal-info-grid" aria-hidden="true">
                <div>
                  <strong>Networks</strong>
                  <span>PulseChain, Ethereum, and Base sync from the same address.</span>
                </div>
                <div>
                  <strong>Best Result</strong>
                  <span>Add an Etherscan key later if you want stronger Ethereum history and invested fiat attribution.</span>
                </div>
              </div>
              <div className="wallet-modal-fields">
                <div className="wallet-modal-field">
                  <label htmlFor="wallet-address-input">Wallet Address</label>
                  <input
                    id="wallet-address-input"
                    type="text"
                    name="wallet-address"
                    placeholder="0xABCD…"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={walletFormError ? true : undefined}
                    aria-describedby="wallet-address-helper"
                    value={newWalletAddress}
                    onChange={(e) => {
                      setNewWalletAddress(e.target.value);
                      if (walletFormError) setWalletFormError('');
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') addWallet(); }}
                    className="wallet-modal-input wallet-modal-input--mono"
                  />
                </div>
                <div id="wallet-address-helper" className="wallet-modal-helper">
                  Use the public address only. One wallet can surface all tracked chains inside the app.
                </div>
                <div className="wallet-modal-field">
                  <label htmlFor="wallet-name-input">
                    Wallet Name <span style={{ color: t.textMuted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <input
                    id="wallet-name-input"
                    type="text"
                    name="wallet-name"
                    placeholder="Main Wallet"
                    autoComplete="off"
                    value={newWalletName}
                    onChange={(e) => {
                      setNewWalletName(e.target.value);
                      if (walletFormError) setWalletFormError('');
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') addWallet(); }}
                    className="wallet-modal-input"
                  />
                </div>
                <div className={`wallet-modal-status${walletFormError ? ' is-error' : ''}`} aria-live="polite">
                  {walletFormError || 'Wallets are read-only. PulsePort never requests private keys or signatures for portfolio tracking.'}
                </div>
                <div className="wallet-modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingWallet(false);
                      setWalletFormError('');
                    }}
                    className="wallet-modal-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addWallet}
                    disabled={!newWalletAddress.trim()}
                    className="wallet-modal-primary"
                  >
                    Track Wallet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Wallet Modal */}
      <AnimatePresence>
        {editingWalletAddress && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingWalletAddress(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 90 }}
              className="wallet-modal-panel wallet-modal-panel--compact sm:rounded-[20px]"
            >
              <div className="sm:hidden" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Pencil size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Rename Wallet</span>
              </div>
              <div className="wallet-modal-address-chip">
                {editingWalletAddress}
              </div>
              <div className="wallet-modal-field" style={{ marginBottom: 20 }}>
                <label htmlFor="wallet-rename-input">Wallet Name</label>
                <input
                  id="wallet-rename-input"
                  type="text"
                  name="wallet-rename"
                  value={editWalletName}
                  onChange={e => setEditWalletName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') renameWallet(editingWalletAddress, editWalletName); }}
                  autoComplete="off"
                  className="wallet-modal-input"
                />
              </div>
              <div className="wallet-modal-actions">
                <button type="button" onClick={() => setEditingWalletAddress(null)}
                  className="wallet-modal-secondary">
                  Cancel
                </button>
                <button type="button" onClick={() => renameWallet(editingWalletAddress, editWalletName)}
                  className="wallet-modal-primary">
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* P&L Modal */}
      {pnlAsset && (
        <PnLModal
          asset={pnlAsset}
          transactions={currentTransactions}
          prices={prices}
          logoUrl={STATIC_LOGOS[(pnlAsset as any).address?.toLowerCase?.()] || (pnlAsset as any).logoUrl || tokenLogos[(pnlAsset as any).address?.toLowerCase?.()] || getTokenLogoUrl(pnlAsset)}
          onClose={() => setPnlAsset(null)}
          walletAddress={selectedWalletAddr !== 'all' ? selectedWalletAddr : undefined}
        />
      )}

      {/* Token Card Detail Modal */}
      {tokenCardModal && (
        <TokenCardModal
          asset={tokenCardModal}
          portfolioTotal={summary.totalValue}
          logoUrl={STATIC_LOGOS[(tokenCardModal as any).address?.toLowerCase?.()] || (tokenCardModal as any).logoUrl || tokenLogos[(tokenCardModal as any).address?.toLowerCase?.()] || getTokenLogoUrl(tokenCardModal)}
          marketData={tokenMarketData[tokenCardModal.id]}
          isLoadingMarketData={tokenCardModalLoading}
          theme={theme}
          onClose={() => setTokenCardModal(null)}
          dexScreenerUrl={dexScreenerUrl(tokenCardModal.chain, (tokenCardModal as any).address)}
          explorerUrl={explorerUrl(tokenCardModal.chain, (tokenCardModal as any).address)}
        />
      )}

      {/* Custom Coin Modal - Now uses AddCoinModal with DexScreener validation */}
      <AddCoinModal
        isOpen={isCustomCoinsModalOpen}
        onClose={() => setIsCustomCoinsModalOpen(false)}
        onAdd={(coin) => {
          setCustomCoinDraft({
            symbol: coin.symbol,
            name: coin.name,
            balance: '',
            price: '',
          });
          submitCustomCoin();
          setIsCustomCoinsModalOpen(false);
        }}
        theme={theme}
      />

      {/* Market Watch Modal */}
      {showMarketWatch && (
        <MarketWatchModal
          theme={theme}
          initialSearch={marketWatchInitialSearch}
          onClose={() => setShowMarketWatch(false)}
        />
      )}

      {/* Profit Planner Modal */}
      {profitPlannerOpen && (
        <ProfitPlannerModal
          open={profitPlannerOpen}
          onClose={() => setProfitPlannerOpen(false)}
          assets={currentAssets}
          totalValue={summary?.totalValue ?? 0}
        />
      )}

      {/* API Key Modal */}
      <AnimatePresence>
        {isApiKeyModalOpen && (
          <div className="api-key-backdrop fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 24 }}
              className="api-key-panel">
              <div className="api-key-drag-handle" />
              <div className="api-key-head">
                <div className="api-key-head-icon">
                  <Settings size={18} />
                </div>
                <div>
                  <span>API Key</span>
                  <small>Optional, but recommended for Ethereum history</small>
                </div>
              </div>
              <div className="api-key-info-grid">
                <div>
                  <strong>Who provides it?</strong>
                  <span>Etherscan. A free Etherscan V2 API key lets PulsePort read your public Ethereum transactions more reliably.</span>
                </div>
                <div>
                  <strong>Why is it here?</strong>
                  <span>It improves ETH deposits, stablecoin inflows, transaction history, and invested/P&L calculations. Your key is saved only in this browser.</span>
                </div>
                <div>
                  <strong>What still works without it?</strong>
                  <span>PulseChain balances, PulseChain transactions, Base via Blockscout, prices, Market Watch, and manual coins still work.</span>
                </div>
              </div>
              <a className="api-key-link" href="https://etherscan.io/myapikey" target="_blank" rel="noopener noreferrer">
                Get a free key from Etherscan <ExternalLink size={12} />
              </a>
              <label className="api-key-input-label">
                Etherscan API key
                <input type="text" id="etherscan-api-key-input" name="etherscan-api-key" placeholder="Paste your Etherscan API key…"
                value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                />
              </label>
              <div className="api-key-actions">
                <button type="button" onClick={() => setIsApiKeyModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" onClick={() => {
                  const ethKey = apiKeyInput.trim();
                  setEtherscanApiKey(ethKey);
                  if (ethKey) localStorage.setItem('pulseport_etherscan_key', ethKey);
                  else localStorage.removeItem('pulseport_etherscan_key');
                  localStorage.removeItem('pulseport_basescan_key');
                  setIsApiKeyModalOpen(false);
                  setTimeout(fetchPortfolio, 100);
                }}
                  className="api-key-save">
                  Save &amp; Refresh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
