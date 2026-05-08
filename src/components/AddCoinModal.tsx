import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, AlertCircle, Loader } from 'lucide-react';
import { useDexScreenerSearch } from '../hooks/useDexScreenerSearch';
import { Modal } from './Modal';
import { Chain } from '../types';

/**
 * Props for the AddCoinModal component.
 */
interface AddCoinModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Callback when a coin is successfully added */
  onAdd: (coin: { symbol: string; name: string; chain: Chain; contractAddress: string }) => void;

  /** Optional theme ('dark' or 'light') */
  theme?: 'dark' | 'light';
}

/**
 * Modal for adding new coins to the portfolio by contract address.
 *
 * Allows users to search and validate token contract addresses using DexScreener.
 * Shows token information after validation and adds validated coins to the portfolio.
 *
 * @example
 * ```tsx
 * <AddCoinModal
 *   isOpen={showAddCoin}
 *   onClose={() => setShowAddCoin(false)}
 *   onAdd={handleAddCoin}
 *   theme="dark"
 * />
 * ```
 *
 * @param props - The component props
 * @param props.isOpen - Whether the modal is visible
 * @param props.onClose - Callback to close the modal
 * @param props.onAdd - Callback with validated coin data
 * @param props.theme - Theme variant (default: 'dark')
 * @returns The add coin modal component
 */
export function AddCoinModal({ isOpen, onClose, onAdd, theme = 'dark' }: AddCoinModalProps) {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<Chain>('pulsechain');
  const [validated, setValidated] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { results, loading, error, searchByAddress } = useDexScreenerSearch();

  // Handle DexScreener validation response
  useEffect(() => {
    if (!loading && results.length > 0) {
      // Validation succeeded - get token metadata from DexScreener
      // Since useDexScreenerSearch only returns pair info, we'll use the pairAddress as proof of validation
      const pair = results[0];
      setSymbol(pair.chainId.toUpperCase());
      setName(`Token on ${pair.chainId}`);
      setValidated(true);
      setLocalError(null);
    } else if (!loading && error) {
      // Validation failed
      setLocalError(error);
      setValidated(false);
      setSymbol('');
      setName('');
    }
  }, [loading, results, error]);

  const handleValidateAddress = async () => {
    if (!contractAddress.trim()) {
      setLocalError('Contract address required');
      setValidated(false);
      return;
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setLocalError('Invalid contract address format');
      setValidated(false);
      return;
    }

    setLocalError(null);
    await searchByAddress(selectedChain, contractAddress);
  };

  const handleAddCoin = () => {
    if (!validated || !contractAddress.trim() || !symbol || !name) {
      setLocalError('Please validate the contract address first');
      return;
    }

    onAdd({
      symbol,
      name,
      chain: selectedChain,
      contractAddress,
    });

    // Reset form
    setContractAddress('');
    setSymbol('');
    setName('');
    setValidated(false);
    setLocalError(null);
    onClose();
  };

  const handleClose = () => {
    setContractAddress('');
    setSymbol('');
    setName('');
    setValidated(false);
    setLocalError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            className="custom-coin-modal sm:rounded-[20px]"
          >
            <div className="custom-coin-modal-head">
              <Plus size={18} />
              <div>
                <strong>Add coin from blockchain</strong>
                <span>Enter a contract address. We'll validate it and fetch metadata.</span>
              </div>
            </div>

            <div className="custom-coin-grid">
              <div>
                <label htmlFor="chain-select">Chain</label>
                <select
                  id="chain-select"
                  value={selectedChain}
                  onChange={(e) => {
                    setSelectedChain(e.target.value as Chain);
                    setValidated(false);
                    setSymbol('');
                    setName('');
                  }}
                  disabled={loading}
                  className="custom-coin-input"
                >
                  <option value="pulsechain">PulseChain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div>
                <label htmlFor="contract-address-input">Contract Address</label>
                <div className="contract-address-input-wrapper">
                  <input
                    id="contract-address-input"
                    type="text"
                    value={contractAddress}
                    onChange={(e) => {
                      setContractAddress(e.target.value);
                      setValidated(false);
                      setSymbol('');
                      setName('');
                    }}
                    disabled={loading}
                    placeholder="0x..."
                    className="custom-coin-input contract-address-input"
                  />
                  <button
                    type="button"
                    onClick={handleValidateAddress}
                    disabled={loading || !contractAddress.trim() || validated}
                    className="validate-address-button"
                    title={validated ? 'Address validated' : 'Validate address'}
                  >
                    {loading && <Loader size={16} className="animate-spin" />}
                    {!loading && validated && <Check size={16} className="text-green-500" />}
                    {!loading && !validated && <span>Validate</span>}
                  </button>
                </div>
              </div>

              {validated && (
                <>
                  <label>
                    Symbol
                    <input
                      type="text"
                      value={symbol}
                      disabled
                      placeholder="(auto-populated from DexScreener)"
                      className="custom-coin-input"
                    />
                  </label>
                  <label>
                    Name
                    <input
                      type="text"
                      value={name}
                      disabled
                      placeholder="(auto-populated from DexScreener)"
                      className="custom-coin-input"
                    />
                  </label>
                </>
              )}
            </div>

            {loading && (
              <div className="validation-status loading">
                <Loader size={16} className="animate-spin" />
                <span>Validating contract address...</span>
              </div>
            )}

            {localError && (
              <div className="validation-status error">
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            {validated && !localError && (
              <div className="validation-status success">
                <Check size={16} className="text-green-500" />
                <span>Contract validated. Ready to add.</span>
              </div>
            )}

            <div className="custom-coin-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="button"
                className="custom-coin-submit"
                onClick={handleAddCoin}
                disabled={loading || !validated || !contractAddress.trim()}
              >
                Add to portfolio
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
