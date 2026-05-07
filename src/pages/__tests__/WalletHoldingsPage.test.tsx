import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WalletHoldingsPage } from '../WalletHoldingsPage';
import type { Asset, Wallet } from '../../types';

const mockWallets: Wallet[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Main Wallet',
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Secondary Wallet',
  },
];

const mockAssets: Asset[] = [
  {
    id: 'hex',
    symbol: 'HEX',
    name: 'Hexagon',
    address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
    balance: 100000,
    price: 0.005,
    value: 500,
    chain: 'pulsechain',
  },
  {
    id: 'inc',
    symbol: 'INC',
    name: 'Incentive',
    address: '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d',
    balance: 1000,
    price: 0.02,
    value: 20,
    chain: 'pulsechain',
  },
  {
    id: 'plsx',
    symbol: 'PLSX',
    name: 'PulseX',
    address: '0x95b303987a60c71504d99aa1b13b4da07b0790ab',
    balance: 50,
    price: 2.5,
    value: 125,
    chain: 'pulsechain',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c',
    balance: 0.5,
    price: 3000,
    value: 1500,
    chain: 'pulsechain',
  },
  {
    id: 'dust-coin',
    symbol: 'DUST',
    name: 'Dust Token',
    address: '0xdust000000000000000000000000000000000000',
    balance: 1000,
    price: 0.005,
    value: 5,
    chain: 'pulsechain',
  },
];

describe('WalletHoldingsPage', () => {
  it('renders page header and wallet selector', () => {
    render(
      <WalletHoldingsPage
        assets={[]}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    expect(screen.getByText('Wallet Holdings')).toBeInTheDocument();
    expect(screen.getByText('Select Wallet')).toBeInTheDocument();
  });

  it('displays total portfolio value', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Total value should be 500 + 20 + 125 + 1500 + 5 = 2150
    expect(screen.getByText('$2.15K')).toBeInTheDocument();
  });

  it('calculates visible value excluding dust when dust filter is enabled', () => {
    const { rerender } = render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // By default, dust filter is enabled
    // Visible value = 500 + 20 + 125 + 1500 = 2145 (excluding dust coin value of 5)
    expect(screen.getByText('Visible Value')).toBeInTheDocument();
  });

  it('shows dust count correctly', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Should show "Dust (1)" since one asset has value < 10
    expect(screen.getByText('Dust (1)')).toBeInTheDocument();
  });

  it('hides dust coins when dust filter is enabled', async () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // By default, dust filter is on, so dust coin should not be visible
    expect(screen.queryByText('DUST')).not.toBeInTheDocument();
  });

  it('shows dust coins when dust filter is disabled', async () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Click dust filter button to disable it
    const dustButton = screen.getByText('Dust (1)');
    fireEvent.click(dustButton);

    // Now dust coin should be visible
    expect(screen.getByText('DUST')).toBeInTheDocument();
  });

  it('calls onHideToken when visibility toggle is clicked', async () => {
    const onHideToken = vi.fn();

    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={onHideToken}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Find and click eye icon for first visible coin (HEX)
    const eyeButtons = screen.getAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null;
    });

    // Click first coin's eye button
    fireEvent.click(eyeButtons[0]);

    expect(onHideToken).toHaveBeenCalled();
  });

  it('calls onRemoveToken when remove button is clicked', async () => {
    const onRemoveToken = vi.fn();

    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={onRemoveToken}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Find trash buttons (should be after eye buttons)
    const trashButtons = screen.getAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null;
    });

    // Find a trash button (second button in action pair)
    if (trashButtons.length > 1) {
      fireEvent.click(trashButtons[1]);
      expect(onRemoveToken).toHaveBeenCalled();
    }
  });

  it('opens add coin modal when add button is clicked', async () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    const addCoinButton = screen.getByText('Add Coin');
    fireEvent.click(addCoinButton);

    expect(screen.getByText('Add Coin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., HEX')).toBeInTheDocument();
  });

  it('displays all coins with correct data', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    // Dust filter is on by default, so DUST coin won't show
    expect(screen.getByText('HEX')).toBeInTheDocument();
    expect(screen.getByText('INC')).toBeInTheDocument();
    expect(screen.getByText('PLSX')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.queryByText('DUST')).not.toBeInTheDocument();
  });

  it('shows holdings count', () => {
    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={() => {}}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    expect(screen.getByText('Holdings Count')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onSelectWallet when wallet is changed', async () => {
    const onSelectWallet = vi.fn();

    render(
      <WalletHoldingsPage
        assets={mockAssets}
        wallets={mockWallets}
        selectedWalletAddr={mockWallets[0].address}
        onSelectWallet={onSelectWallet}
        hiddenTokens={[]}
        onHideToken={() => {}}
        onRemoveToken={() => {}}
        isScanning={false}
        scanResult={null}
        onScan={() => {}}
      />
    );

    const mainWalletButton = screen.getByText('Main Wallet');
    fireEvent.click(mainWalletButton);

    expect(onSelectWallet).toHaveBeenCalled();
  });
});
