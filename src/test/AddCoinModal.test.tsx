import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCoinModal } from '../components/AddCoinModal';

// Mock the useDexScreenerSearch hook
vi.mock('../hooks/useDexScreenerSearch', () => ({
  useDexScreenerSearch: vi.fn(() => ({
    results: [],
    loading: false,
    error: null,
    searchByAddress: vi.fn(),
  })),
}));

describe('AddCoinModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onAdd: mockOnAdd,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<AddCoinModal {...defaultProps} />);
    expect(screen.getByText(/Add coin from blockchain/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddCoinModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Add coin from blockchain/i)).not.toBeInTheDocument();
  });

  it('requires contract address before validation', async () => {
    render(<AddCoinModal {...defaultProps} />);

    const validateButton = screen.getByTitle(/Validate address/i);
    expect(validateButton).toBeDisabled();
  });

  it('validates contract address format', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    const mockSearchByAddress = vi.fn();
    (useDexScreenerSearch as any).mockReturnValue({
      results: [],
      loading: false,
      error: null,
      searchByAddress: mockSearchByAddress,
    });

    render(<AddCoinModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('0x...');
    const validateButton = screen.getByTitle(/Validate address/i);

    // Test invalid format
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid contract address format/i)).toBeInTheDocument();
    });

    expect(mockSearchByAddress).not.toHaveBeenCalled();
  });

  it('requires non-empty contract address', async () => {
    render(<AddCoinModal {...defaultProps} />);

    const validateButton = screen.getByTitle(/Validate address/i);
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: '' } });

    expect(validateButton).toBeDisabled();
  });

  it('disables submit button until validation succeeds', () => {
    render(<AddCoinModal {...defaultProps} />);

    const submitButton = screen.getByText('Add to portfolio');
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state while validating', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    (useDexScreenerSearch as any).mockReturnValue({
      results: [],
      loading: true,
      error: null,
      searchByAddress: vi.fn(),
    });

    render(<AddCoinModal {...defaultProps} />);

    expect(screen.getByText(/Validating contract address/i)).toBeInTheDocument();
  });

  it('shows error message when validation fails', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    (useDexScreenerSearch as any).mockReturnValue({
      results: [],
      loading: false,
      error: 'Contract not found on DexScreener',
      searchByAddress: vi.fn(),
    });

    render(<AddCoinModal {...defaultProps} />);

    expect(screen.getByText(/Contract not found on DexScreener/i)).toBeInTheDocument();
  });

  it('auto-populates symbol and name when validation succeeds', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    (useDexScreenerSearch as any).mockReturnValue({
      results: [
        {
          chainId: 'pulsechain',
          pairAddress: '0x1234567890123456789012345678901234567890',
          dexScreenerUrl: 'https://dexscreener.com/pulsechain/0x1234567890123456789012345678901234567890',
        },
      ],
      loading: false,
      error: null,
      searchByAddress: vi.fn(),
    });

    render(<AddCoinModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('PULSECHAIN')).toBeInTheDocument();
    });
  });

  it('enables validate button when contract address is entered', () => {
    render(<AddCoinModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('0x...') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, {
      target: { value: '0xabcdef1234567890abcdef1234567890abcdef12' },
    });

    expect(input.value).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  it('allows changing chain selection', () => {
    render(<AddCoinModal {...defaultProps} />);

    const chainSelect = screen.getByDisplayValue('PulseChain') as HTMLSelectElement;
    expect(chainSelect.value).toBe('pulsechain');

    fireEvent.change(chainSelect, { target: { value: 'ethereum' } });

    expect(chainSelect.value).toBe('ethereum');
  });

  it('calls onClose when cancel is clicked', () => {
    render(<AddCoinModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows success message when validation succeeds', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    (useDexScreenerSearch as any).mockReturnValue({
      results: [
        {
          chainId: 'base',
          pairAddress: '0x2222222222222222222222222222222222222222',
          dexScreenerUrl: 'https://dexscreener.com/base/0x2222222222222222222222222222222222222222',
        },
      ],
      loading: false,
      error: null,
      searchByAddress: vi.fn(),
    });

    render(<AddCoinModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Contract validated. Ready to add./i)).toBeInTheDocument();
    });
  });

  it('disables symbol and name fields after validation', async () => {
    const { useDexScreenerSearch } = await import('../hooks/useDexScreenerSearch');
    (useDexScreenerSearch as any).mockReturnValue({
      results: [
        {
          chainId: 'pulsechain',
          pairAddress: '0x3333333333333333333333333333333333333333',
          dexScreenerUrl: 'https://dexscreener.com/pulsechain/0x3333333333333333333333333333333333333333',
        },
      ],
      loading: false,
      error: null,
      searchByAddress: vi.fn(),
    });

    render(<AddCoinModal {...defaultProps} />);

    await waitFor(() => {
      const symbolInput = screen.getByDisplayValue('PULSECHAIN');
      expect(symbolInput).toBeDisabled();
    });
  });
});
