import React from 'react';
import { EyeOff } from 'lucide-react';
import { CoinList, type CoinListItem } from '../components/CoinList';
import type { Asset, Wallet } from '../types';

/**
 * Props for the WalletHoldingsPage component.
 */
interface WalletHoldingsPageProps {
  /** All assets across all wallets */
  assets: Asset[];

  /** All available wallets */
  wallets: Wallet[];

  /** Currently selected wallet address (null = all wallets) */
  selectedWalletAddr: string | null;

  /** Callback when wallet selection changes */
  onSelectWallet: (addr: string) => void;

  /** Set of hidden token IDs */
  hiddenTokens: Set<string>;

  /** Callback to hide a token from display */
  onHideToken: (id: string) => void;

  /** Callback to remove a token completely */
  onRemoveToken: (id: string) => void;

  /** Callback to add a new coin */
  onAddCoin: (asset: Asset) => void;
}

/**
 * Wallet holdings page displaying assets for selected wallet.
 *
 * Shows a filterable list of holdings for a single wallet or all wallets combined.
 * Allows hiding tokens temporarily and removing them permanently.
 * Displays total portfolio value and individual asset values with price changes.
 *
 * @example
 * ```tsx
 * <WalletHoldingsPage
 *   assets={allAssets}
 *   wallets={userWallets}
 *   selectedWalletAddr={activeWallet}
 *   onSelectWallet={handleSelectWallet}
 *   hiddenTokens={hiddenTokens}
 *   onHideToken={handleHideToken}
 *   onRemoveToken={handleRemoveToken}
 *   onAddCoin={handleAddCoin}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.assets - All assets to display
 * @param props.wallets - Available wallets for selection
 * @param props.selectedWalletAddr - Currently selected wallet
 * @param props.onSelectWallet - Callback when wallet is changed
 * @param props.hiddenTokens - Tokens hidden from view
 * @param props.onHideToken - Callback to hide a token
 * @param props.onRemoveToken - Callback to remove a token
 * @param props.onAddCoin - Callback to add a new coin
 * @returns The wallet holdings page component
 */
export function WalletHoldingsPage(props: WalletHoldingsPageProps) {
  // Filter assets for selected wallet
  const walletAssets = React.useMemo(() => {
    if (!props.selectedWalletAddr) return [];
    return props.assets.filter(
      (a) => a.id.toLowerCase().includes(props.selectedWalletAddr.toLowerCase())
    );
  }, [props.assets, props.selectedWalletAddr]);

  // Convert to CoinListItem format and filter hidden
  const coinListItems = React.useMemo(() => {
    return walletAssets
      .filter((a) => !props.hiddenTokens.has(a.id))
      .map((a) => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        chain: a.chain,
        logoUrl: a.logoUrl,
        priceUsd: a.price,
        change24h: a.priceChange24h,
        balance: a.balance,
        valueUsd: a.value,
      } as CoinListItem));
  }, [walletAssets, props.hiddenTokens]);

  const selectedWallet = props.wallets.find(
    (w) => w.address.toLowerCase() === props.selectedWalletAddr?.toLowerCase()
  );

  const totalValue = React.useMemo(
    () => coinListItems.reduce((sum, a) => sum + a.valueUsd, 0),
    [coinListItems]
  );

  return (
    <div className="page-shell page-shell--spaced">
      {/* Header Section */}
      <section className="control-bar" aria-label="Holdings controls">
        <div className="control-bar-title">
          <p className="control-bar-title-label">Holdings</p>
          <h2 className="control-bar-title-heading">
            {selectedWallet ? selectedWallet.name : 'All Wallets'}
          </h2>
          {totalValue > 0 && (
            <p className="text-sm text-white/60" style={{ marginTop: 8 }}>
              Total Value: ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Wallet Selector */}
        {props.wallets.length > 1 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={props.selectedWalletAddr || ''}
              onChange={(e) => props.onSelectWallet(e.target.value)}
              className="holdings-wallet-selector"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--fg)',
                fontSize: 13,
                padding: '8px 12px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">All Wallets</option>
              {props.wallets.map((w) => (
                <option key={w.address} value={w.address}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>


      {/* Holdings List */}
      <section className="table-wrapper" aria-label="Holdings workspace">
        {coinListItems.length > 0 ? (
          <CoinList
            items={coinListItems}
            variant="compact"
            emptyMessage="No holdings found"
            onRemove={(item) => props.onRemoveToken(item.id)}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--fg-muted)',
            }}
          >
            <p>No holdings found</p>
            {props.hiddenTokens.size > 0 && (
              <p style={{ fontSize: 12, marginTop: 8 }}>
                {props.hiddenTokens.size} token(s) hidden
              </p>
            )}
          </div>
        )}
      </section>

      {/* Hidden Tokens Info */}
      {props.hiddenTokens.size > 0 && (
        <section
          style={{
            padding: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--fg-muted)',
          }}
        >
          <p>
            <EyeOff size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {props.hiddenTokens.size} token(s) hidden from view
          </p>
        </section>
      )}
    </div>
  );
}

export type { WalletHoldingsPageProps };
