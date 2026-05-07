import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Chain } from '../../types';

interface AddCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (coin: {
    symbol: string;
    name: string;
    chain: Chain;
    contractAddress: string;
  }) => void;
  theme?: 'light' | 'dark';
}

const CHAINS: { id: Chain; label: string }[] = [
  { id: 'pulsechain', label: 'PulseChain' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
];

export function AddCoinModal({ isOpen, onClose, onAdd, theme = 'light' }: AddCoinModalProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [chain, setChain] = useState<Chain>('pulsechain');
  const [contractAddress, setContractAddress] = useState('');
  const [error, setError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!symbol.trim()) {
      setError('Symbol is required');
      return;
    }

    if (!contractAddress.trim()) {
      setError('Contract address is required');
      return;
    }

    // Basic validation for contract address format
    if (!contractAddress.toLowerCase().match(/^0x[a-f0-9]{40}$/i)) {
      setError('Invalid contract address');
      return;
    }

    onAdd({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim(),
      chain,
      contractAddress: contractAddress.toLowerCase(),
    });

    // Reset form
    setSymbol('');
    setName('');
    setChain('pulsechain');
    setContractAddress('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" role="dialog" aria-modal="true">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Coin</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g., HEX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hexagon (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chain *
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as Chain)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="wallet-modal-field">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Contract Address *
            </label>
            <input
              id="address"
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              aria-describedby="address-error"
            />
            {contractAddress && !/^0x[0-9a-fA-F]{40}$/.test(contractAddress) && (
              <div id="address-error" className="text-red-500 text-sm mt-1">
                Contract address must be 0x followed by 40 hex characters
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Coin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
