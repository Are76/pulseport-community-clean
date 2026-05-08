import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WalletHoldingsPage } from '../pages/WalletHoldingsPage';
import type { Asset, Wallet } from '../types';

const mockAssets: Asset[] = [
  {
    id: '0x123abc-hex',
    symbol: 'HEX',
    name: 'HEX',
    balance: 425000,
    price: 0.0014,
    value: 595,
    chain: 'pulsechain',
    priceChange24h: 2.5,
  },
  {
    id: '0x123abc-pls',
    symbol: 'PLS',
    name: 'Pulse',
    balance: 1000000,
    price: 0.000078,
    value: 78,
    chain: 'pulsechain',
    priceChange24h: -1.2,
  },
];

const mockWallets: Wallet[] = [
  { address: '0x123abc', name: 'Wallet 1' },
  { address: '0x456def', name: 'Wallet 2' },
];

describe('WalletHoldingsPage', () => {
  it('renders holdings for selected wallet', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr="0x123abc"
        onSelectWallet={() => {}}
        hiddenTokens={new Set()}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        onAddCoin={() => {}}
      />
    );

    expect(screen.getByText('Holdings')).toBeInTheDocument();
  });

  it('displays total value when assets exist', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr="0x123abc"
        onSelectWallet={() => {}}
        hiddenTokens={new Set()}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        onAddCoin={() => {}}
      />
    );

    expect(screen.getByText(/Total Value:/)).toBeInTheDocument();
  });

  it('shows wallet selector when multiple wallets exist', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr="0x123abc"
        onSelectWallet={() => {}}
        hiddenTokens={new Set()}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        onAddCoin={() => {}}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveValue('0x123abc');
  });

  it('shows hidden tokens notice when tokens are hidden', () => {
    const hiddenSet = new Set(['0x123abc-hex']);

    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr="0x123abc"
        onSelectWallet={() => {}}
        hiddenTokens={hiddenSet}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        onAddCoin={() => {}}
      />
    );

    expect(screen.getByText(/1 token\(s\) hidden/)).toBeInTheDocument();
  });

  it('shows empty state when no holdings exist', () => {
    render(
      <WalletHoldingsPage
        assets={[]}
        wallets={mockWallets}
        selectedWalletAddr="0x123abc"
        onSelectWallet={() => {}}
        hiddenTokens={new Set()}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        onAddCoin={() => {}}
      />
    );

    expect(screen.getByText('No holdings found')).toBeInTheDocument();
  });
});
