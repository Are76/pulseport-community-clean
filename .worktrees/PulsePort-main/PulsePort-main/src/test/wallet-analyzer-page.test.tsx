import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WalletAnalyzerPage } from '../pages/WalletAnalyzer';
import type { Asset, InvestmentHoldingRow, Transaction } from '../types';

const rows: InvestmentHoldingRow[] = [
  {
    id: 'hex',
    symbol: 'HEX',
    name: 'HEX',
    chain: 'pulsechain',
    amount: 425000,
    currentPrice: 0.0014,
    currentValue: 596.28,
    costBasis: 721.82,
    pnlUsd: -125.54,
    pnlPercent: -17.39,
    sourceMix: [{ asset: 'ETH', chain: 'ethereum', amountUsd: 721.82 }],
    routeSummary: 'Ethereum -> Bridge -> PulseX -> HEX',
    thenValue: 721.82,
    nowValue: 596.28,
  },
  {
    id: 'inc',
    symbol: 'INC',
    name: 'Incentive',
    chain: 'pulsechain',
    amount: 50,
    currentPrice: 5.2,
    currentValue: 260,
    costBasis: 180,
    pnlUsd: 80,
    pnlPercent: 44.44,
    sourceMix: [{ asset: 'USDC', chain: 'ethereum', amountUsd: 180 }],
    routeSummary: 'Bridge -> PulseX -> INC',
    thenValue: 180,
    nowValue: 260,
  },
];

const assets: Asset[] = [
  { id: 'hex', symbol: 'HEX', name: 'HEX', balance: 425000, price: 0.0014, value: 596.28, chain: 'pulsechain' },
  { id: 'inc', symbol: 'INC', name: 'Incentive', balance: 50, price: 5.2, value: 260, chain: 'pulsechain' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: 1.5, price: 3450, value: 5175, chain: 'ethereum' },
];

const transactions: Transaction[] = [
  {
    id: 't1',
    hash: '0x1',
    timestamp: new Date('2026-04-29T12:00:00Z').getTime(),
    type: 'deposit',
    from: '0xsource',
    to: '0xwallet',
    asset: 'ETH',
    amount: 1.5,
    valueUsd: 5175,
    chain: 'ethereum',
  },
  {
    id: 't2',
    hash: '0x2',
    timestamp: new Date('2026-04-30T09:00:00Z').getTime(),
    type: 'swap',
    from: '0xwallet',
    to: '0xwallet',
    asset: 'INC',
    amount: 50,
    valueUsd: 260,
    counterAsset: 'USDC',
    counterAmount: 180,
    chain: 'pulsechain',
  },
];

describe('WalletAnalyzerPage', () => {
  it('renders an executive summary with planner and transaction actions', () => {
    const onOpenPlanner = vi.fn();
    const onOpenTransactions = vi.fn();
    const onInspectHolding = vi.fn();

    render(
      <WalletAnalyzerPage
        investedFiat={5400}
        totalValue={6031.28}
        liquidValue={6031.28}
        stakedValue={0}
        rows={rows}
        assets={assets}
        transactions={transactions}
        onOpenPlanner={onOpenPlanner}
        onOpenTransactions={onOpenTransactions}
        onInspectHolding={onInspectHolding}
      />,
    );

    expect(screen.getByRole('heading', { name: /wallet analyzer/i })).toBeInTheDocument();
    expect(screen.getByText(/capital command/i)).toBeInTheDocument();
    expect(screen.getByText('What needs action now')).toBeInTheDocument();
    expect(screen.getByText('Decision support')).toBeInTheDocument();
    expect(screen.getByText('Highest conviction')).toBeInTheDocument();
    expect(screen.getByText('Latest movement')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /open profit planner/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /review transactions/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /inspect hex/i })[0]);

    expect(onOpenPlanner).toHaveBeenCalledTimes(1);
    expect(onOpenTransactions).toHaveBeenCalledTimes(1);
    expect(onInspectHolding).toHaveBeenCalledWith(rows[0]);
  });
});
