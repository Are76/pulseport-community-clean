import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletsTab } from '../tabs/WalletsTab';

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
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    render(<WalletsTab {...mockProps} />);
    const copyButtons = screen.getAllByTitle('Copy address');
    fireEvent.click(copyButtons[0]);
    expect(mockClipboard.writeText).toHaveBeenCalledWith('0x123');
  });

  it('opens edit dialog on rename', () => {
    render(<WalletsTab {...mockProps} />);
    const renameButtons = screen.getAllByTitle('Rename');
    fireEvent.click(renameButtons[0]);
    expect(mockProps.onOpenEditWallet).toHaveBeenCalledWith('0x123', 'Main');
  });

  it('removes wallet on delete', () => {
    render(<WalletsTab {...mockProps} />);
    const deleteButtons = screen.getAllByTitle('Remove');
    fireEvent.click(deleteButtons[0]);
    expect(mockProps.onRemoveWallet).toHaveBeenCalledWith('0x123');
  });

  it('renders add wallet button in header', () => {
    render(<WalletsTab {...mockProps} />);
    const addButton = screen.getByRole('button', { name: /Add Wallet/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(mockProps.onOpenAddWallet).toHaveBeenCalled();
  });

  it('renders add wallet button in empty state', () => {
    render(<WalletsTab {...mockProps} wallets={[]} />);
    const addButton = screen.getByRole('button', { name: /Add your first wallet/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(mockProps.onOpenAddWallet).toHaveBeenCalled();
  });

  it('marks selected wallet with active class', () => {
    const { container } = render(<WalletsTab {...mockProps} />);
    const walletItems = container.querySelectorAll('.wallet-item');
    expect(walletItems[0]).toHaveClass('active');
    expect(walletItems[1]).not.toHaveClass('active');
  });
});
