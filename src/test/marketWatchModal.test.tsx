import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketWatchModal } from '../components/MarketWatchModal';

describe('MarketWatchModal', () => {
  const mockProps = {
    theme: 'dark' as const,
    onClose: vi.fn(),
    initialSearch: '',
  };

  it('renders market watch modal', () => {
    render(<MarketWatchModal {...mockProps} />);
    expect(screen.getByText(/market watch/i)).toBeInTheDocument();
  });

  it('has import watchlist button', async () => {
    render(<MarketWatchModal {...mockProps} />);
    const importButton = screen.getByTitle('Import DexScreener watchlist link');
    expect(importButton).toBeInTheDocument();
  });

  it('displays search input', async () => {
    render(<MarketWatchModal {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search by name, symbol, or 0x contract address/i);
    expect(searchInput).toBeInTheDocument();
  });
});
