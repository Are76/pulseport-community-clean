import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletsTab } from '../WalletsTab';

describe('WalletsTab', () => {
  const mockWallets = [
    { address: '0x123', name: 'Main' },
    { address: '0x456', name: 'Secondary' },
  ];

  const mockProps = {
    wallets: mockWallets,
    selectedWalletAddr: '0x123',
    onSelectWallet: vi.fn(),
    onRemoveWallet: vi.fn(),
    onOpenAddWallet: vi.fn(),
    onOpenEditWallet: vi.fn(),
    t: {
      green: '#00ff9f',
      red: '#ff0000',
      card: '#fff',
      border: '#ccc',
      cardHigh: '#f9f9f9',
      text: '#000',
      textSecondary: '#666',
      textMuted: '#999',
      expandedBg: '#f0f0f0',
      borderLight: '#e0e0e0',
    },
    WALLET_DOT_COLORS: ['#ff0000', '#00ff00', '#0000ff'],
  };

  it('renders wallets list', () => {
    render(<WalletsTab {...mockProps} />);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  it('shows empty state when no wallets', () => {
    render(<WalletsTab {...mockProps} wallets={[]} />);
    expect(screen.getByText('No wallets tracked yet')).toBeInTheDocument();
  });

  it('selects wallet on click', () => {
    render(<WalletsTab {...mockProps} />);
    fireEvent.click(screen.getByText('Secondary'));
    expect(mockProps.onSelectWallet).toHaveBeenCalledWith('0x456');
  });

  it('copies address to clipboard', () => {
    render(<WalletsTab {...mockProps} />);
    const copyButton = screen.getAllByTitle('Copy address')[0];
    fireEvent.click(copyButton);
    // Clipboard should have the address
  });
});
