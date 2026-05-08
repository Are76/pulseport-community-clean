import React from 'react';
import { shortenAddr } from '../utils/appHelpers';
import { WALLET_DOT_COLORS } from '../utils/appConstants';

/**
 * Props for the WalletSelector component.
 */
interface WalletSelectorProps {
  /** Array of wallet addresses to display */
  wallets: string[];

  /** Currently selected wallet address, or null for all wallets view */
  activeWallet: string | null;

  /** Callback when a wallet is selected (pass null for all wallets) */
  onSelect: (addr: string | null) => void;

  /** Callback to add a new wallet */
  onAdd: () => void;

  /** Optional callback to remove a wallet by address */
  onRemove?: (addr: string) => void;

  /** Optional mapping of wallet addresses to display labels */
  walletLabels?: Record<string, string>;
}

/**
 * Wallet selector component for switching between multiple wallets.
 *
 * Displays a horizontal bar of wallet pills with distinct colors for each wallet.
 * Allows users to select individual wallets or view "All" wallets combined.
 * Each wallet can optionally be removed via an X button if onRemove callback is provided.
 * Empty state shows "Add Wallet" button when no wallets are present.
 *
 * @example
 * ```tsx
 * <WalletSelector
 *   wallets={['0x123...', '0x456...']}
 *   activeWallet={selectedAddr}
 *   onSelect={handleSelectWallet}
 *   onAdd={handleAddWallet}
 *   onRemove={handleRemoveWallet}
 *   walletLabels={{
 *     '0x123...': 'Main Wallet',
 *     '0x456...': 'Trading'
 *   }}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.wallets - Array of wallet addresses
 * @param props.activeWallet - Currently selected wallet address (null = all)
 * @param props.onSelect - Callback when wallet is selected
 * @param props.onAdd - Callback to add a new wallet
 * @param props.onRemove - Optional callback to remove a wallet
 * @param props.walletLabels - Optional custom labels for wallet addresses
 * @returns The wallet selector component
 */
export function WalletSelector({ wallets, activeWallet, onSelect, onAdd, onRemove, walletLabels = {} }: WalletSelectorProps) {
  if (wallets.length === 0) {
    return (
      <button onClick={onAdd} className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
        <span style={{ fontSize: 14 }}>+</span> Add Wallet
      </button>
    );
  }
  return (
    <div className="wallet-selector-bar">
      <button className={`wallet-pill${activeWallet === null ? ' active' : ''}`} onClick={() => onSelect(null)}>
        <span className="wallet-dot wallet-dot-multi" />
        All
      </button>
      {wallets.map((addr, idx) => {
        const label = walletLabels[addr] ?? shortenAddr(addr);
        const dotColor = WALLET_DOT_COLORS[idx % WALLET_DOT_COLORS.length];
        const isActive = activeWallet === addr;
        return (
          <button
            key={addr}
            className={`wallet-pill${isActive ? ' active' : ''}`}
            title={addr}
            onClick={() => onSelect(addr)}
            style={isActive ? {
              background: `${dotColor}1a`,
              borderColor: `${dotColor}55`,
              color: dotColor,
            } : undefined}
          >
            <span className="wallet-dot" style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}bb` }} />
            {label}
            {onRemove && (
              <button
                className="wallet-pill-x"
                onClick={e => { e.stopPropagation(); onRemove(addr); }}
                title={`Remove ${label}`}
                aria-label={`Remove ${label}`}
              >
                x
              </button>
            )}
          </button>
        );
      })}
      <button
        className="wallet-pill-add"
        onClick={onAdd}
        title="Add wallet"
        aria-label="Add wallet"
      >
        +
      </button>
    </div>
  );
}
