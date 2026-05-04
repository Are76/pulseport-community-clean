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
  WALLET_DOT_COLORS: string[];
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
      <div className="wallets-page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Wallets Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                Tracked Wallets
              </h3>
              <p style={{ fontSize: 14, color: t.textMuted }}>
                Manage your portfolio's wallet addresses across all chains
              </p>
            </div>
            <button
              onClick={onOpenAddWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={16} />
              Add Wallet
            </button>
          </div>
        </div>

        {/* Wallets List */}
        {wallets.length === 0 ? (
          <div
            style={{
              padding: 32,
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              textAlign: 'center'
            }}
          >
            <Shield size={32} style={{ color: t.textMuted, margin: '0 auto 12px' }} />
            <p style={{ color: t.textMuted, marginBottom: 12 }}>No wallets tracked yet</p>
            <button
              onClick={onOpenAddWallet}
              style={{
                fontSize: 14,
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Add your first wallet
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {wallets.map((wallet, idx) => {
              const isSelected = selectedWalletAddr === wallet.address.toLowerCase();
              const dotColor = getWalletDotColor(idx);

              return (
                <div
                  key={wallet.address}
                  onClick={() => onSelectWallet(wallet.address.toLowerCase())}
                  style={{
                    padding: 16,
                    background: isSelected ? t.expandedBg : t.card,
                    border: `1px solid ${isSelected ? 'var(--accent)' : t.border}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  {/* Wallet Dot */}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: dotColor,
                      boxShadow: `0 0 8px ${dotColor}88`,
                      flexShrink: 0
                    }}
                  />

                  {/* Wallet Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>
                      {wallet.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: t.textMuted,
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {wallet.address}
                    </div>
                  </div>

                  {/* Wallet Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(wallet.address);
                      }}
                      title="Copy address"
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: t.borderLight,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: t.textMuted,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.border;
                        (e.currentTarget as HTMLButtonElement).style.color = t.text;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.borderLight;
                        (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                      }}
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditWallet(wallet.address, wallet.name);
                      }}
                      title="Rename"
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: t.borderLight,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: t.textMuted,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.border;
                        (e.currentTarget as HTMLButtonElement).style.color = t.text;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.borderLight;
                        (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                      }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWallet(wallet.address);
                      }}
                      title="Remove"
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: t.borderLight,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: t.textMuted,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.borderLight;
                        (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                      }}
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
