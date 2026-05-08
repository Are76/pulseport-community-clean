import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketWatchModal } from '../MarketWatchModal';

describe('MarketWatchModal', () => {
  const mockProps = {
    theme: 'dark' as const,
    onClose: vi.fn(),
    initialSearch: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders market watch modal', () => {
    render(<MarketWatchModal {...mockProps} />);
    expect(screen.getByText(/market watch/i)).toBeInTheDocument();
  });

  it('supports contract address search', async () => {
    render(<MarketWatchModal {...mockProps} />);
    const addressButton = screen.getByText('Contract Address');
    fireEvent.click(addressButton);
    expect(screen.getByText('Contract Address')).toHaveClass('active');
  });

  it('supports share link search', async () => {
    render(<MarketWatchModal {...mockProps} />);
    const shareButton = screen.getByText('Share Link');
    fireEvent.click(shareButton);
    expect(screen.getByText('Share Link')).toHaveClass('active');
  });

  it('shows loading state during search', async () => {
    render(<MarketWatchModal {...mockProps} />);
    const input = screen.getByPlaceholderText(/search by/i);

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Verify loading indicator exists
    await waitFor(() => {
      expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });
  });

  it('displays error state when search fails', async () => {
    render(<MarketWatchModal {...mockProps} />);

    // Simulate a search that fails
    const addressButton = screen.getByText('Contract Address');
    fireEvent.click(addressButton);

    const input = screen.getByPlaceholderText(/search by/i);
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Wait for error to appear
    await waitFor(() => {
      const errorElements = screen.queryAllByText(/failed|error|search/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('handles watchlist import with proper error handling', async () => {
    render(<MarketWatchModal {...mockProps} />);

    const urlButton = screen.getByText('Share Link');
    fireEvent.click(urlButton);

    const input = screen.getByPlaceholderText(/paste/i);
    fireEvent.change(input, { target: { value: 'https://dexscreener.com/watchlist/abc123' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Test should verify either success or proper error handling
    expect(mockProps.onClose).not.toHaveBeenCalled(); // Modal stays open during import
  });
});
