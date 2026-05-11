import React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Pencil,
  Shield
} from 'lucide-react';
import type { Wallet } from '../types';
import { cn } from '../lib/utils';

interface WalletsTabProps {
  wallets: Wallet[];
  selectedWalletAddr: string;
  onSelectWallet: (addr: string) => void;
  onRemoveWallet: (addr: string) => void;
  onOpenAddWallet: () => void;
  onOpenEditWallet: (addr: string, name: string) => void;
  t: {
    green: string;
    red: string;
    card: string;
    border: string;
    cardHigh: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    expandedBg: string;
    borderLight: string;
  };
  WALLET_DOT_COLORS: readonly string[];
}

export function WalletsTab({
  wallets,
  selectedWalletAddr,
  onSelectWallet,
  onRemoveWallet,
  onOpenAddWallet,
  onOpenEditWallet,
  t,
  WALLET_DOT_COLORS
}: WalletsTabProps) {
  const getWalletDotColor = (index: number) => WALLET_DOT_COLORS[index % WALLET_DOT_COLORS.length];

  return (
    <div className="wallets-tab-shell">
      <div className="wallets-page-container">
        {/* Header */}
        <div className="wallets-header">
          <div className="wallets-header-top">
            <div>
              <h3 className="wallets-header-title">
                Tracked Wallets
              </h3>
              <p className="wallets-header-subtitle">
                Manage your portfolio's wallet addresses across all chains
              </p>
            </div>
            <button
              onClick={onOpenAddWallet}
              className="wallets-header-button"
            >
              <Plus size={16} />
              Add Wallet
            </button>
          </div>
        </div>

        {/* Wallets List */}
        {wallets.length === 0 ? (
          <div className="wallets-list-empty">
            <Shield size={32} className="wallets-list-empty-icon" />
            <p className="wallets-list-empty-text">No wallets tracked yet</p>
            <button
              onClick={onOpenAddWallet}
              className="wallets-list-empty-button"
            >
              Add your first wallet
            </button>
          </div>
        ) : (
          <div className="wallets-list">
            {wallets.map((wallet, idx) => {
              const isSelected = selectedWalletAddr === wallet.address.toLowerCase();
              const dotColor = getWalletDotColor(idx);

              return (
                <div
                  key={wallet.address}
                  onClick={() => onSelectWallet(wallet.address.toLowerCase())}
                  className={cn('wallet-item', isSelected && 'active')}
                >
                  {/* Wallet Dot */}
                  <div
                    className={cn('wallet-dot', isSelected && 'wallet-dot-shadow')}
                    style={{
                      background: dotColor,
                    }}
                  />

                  {/* Wallet Info */}
                  <div className="wallet-info">
                    <div className="wallet-name">
                      {wallet.name}
                    </div>
                    <div className="wallet-address">
                      {wallet.address}
                    </div>
                  </div>

                  {/* Wallet Actions */}
                  <div className="wallet-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(wallet.address);
                      }}
                      title="Copy address"
                      className="wallet-action-button"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditWallet(wallet.address, wallet.name);
                      }}
                      title="Rename"
                      className="wallet-action-button"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWallet(wallet.address);
                      }}
                      title="Remove"
                      className="wallet-action-button delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
