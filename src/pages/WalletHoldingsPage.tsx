import React from 'react';
import { EyeOff } from 'lucide-react';
import { CoinList, type CoinListItem } from '../components/CoinList';
import type { Asset, Wallet } from '../types';

interface WalletHoldingsPageProps {
  assets: Asset[];
  wallets: Wallet[];
  selectedWalletAddr: string | null;
  onSelectWallet: (addr: string) => void;
  hiddenTokens: Set<string>;
  onHideToken: (id: string) => void;
  onRemoveToken: (id: string) => void;
  isScanning: boolean;
  scanResult: { spam: string[], legitimate: string[] } | null;
  onScan: () => void;
  onAddCoin: (asset: Asset) => void;
}

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

      {/* Action Buttons */}
      <section
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => props.onScan()}
          disabled={props.isScanning}
          style={{
            padding: '8px 16px',
            background: props.isScanning ? 'var(--fg-muted)' : 'var(--accent)',
            color: props.isScanning ? 'var(--fg-muted)' : 'white',
            border: 'none',
            borderRadius: 6,
            cursor: props.isScanning ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: props.isScanning ? 0.5 : 1,
          }}
        >
          {props.isScanning ? 'Scanning...' : 'Scan for Spam'}
        </button>

        {props.scanResult && (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--fg-muted)',
            }}
          >
            Found {props.scanResult.spam.length} spam tokens
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
