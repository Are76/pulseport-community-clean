import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransactionList } from '../components/TransactionList';
import type { Asset, Transaction } from '../types';

describe('TransactionList', () => {
  it('falls back to the current asset price when transaction usd value is zero', () => {
    const tx: Transaction = {
      id: 'most-send',
      hash: '0xmost',
      timestamp: new Date('2026-01-23T12:00:00Z').getTime(),
      type: 'withdraw',
      from: '0xme',
      to: '0xyou',
      asset: 'MOST',
      amount: 15000,
      valueUsd: 0,
      chain: 'pulsechain',
    };

    const assets: Asset[] = [
      {
        id: 'most',
        symbol: 'MOST',
        name: 'MostWanted',
        balance: 15000,
        price: 0.007973,
        value: 119.595,
        chain: 'pulsechain',
      },
    ];

    render(<TransactionList transactions={[tx]} assets={assets} />);

    expect(screen.getByText('$119.59')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/15,000 most/i));

    expect(screen.getAllByText('$119.59').length).toBeGreaterThan(1);
  });

  it('renders partial swap rows with swap detail instead of transfer detail', () => {
    const tx: Transaction = {
      id: 'partial-swap',
      hash: '0xswap',
      timestamp: new Date('2026-04-16T15:07:15Z').getTime(),
      type: 'withdraw',
      from: '0xme',
      to: '0xrouter',
      asset: 'DAI (FORK COPY)',
      amount: 25007.550628,
      valueUsd: 45.84,
      chain: 'pulsechain',
      swapLegOnly: true,
    };

    render(<TransactionList transactions={[tx]} assets={[]} />);

    fireEvent.click(screen.getByText(/25,007.5506 dai/i));

    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText(/counterparty token was not returned by the explorer/i)).toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
  });

  it('supports keyboard expansion for executive transaction rows', () => {
    const tx: Transaction = {
      id: 'keyboard-expand',
      hash: '0xkey',
      timestamp: new Date('2026-04-16T15:07:15Z').getTime(),
      type: 'deposit',
      from: '0xsource',
      to: '0xdestination',
      asset: 'PLS',
      amount: 1200,
      valueUsd: 14,
      chain: 'pulsechain',
    };

    render(<TransactionList transactions={[tx]} />);

    const trigger = screen.getByRole('button', { name: /expand transaction 0xkey/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/received from/i)).toBeInTheDocument();
  });

  it('adds the executive list variant classes when requested', () => {
    const tx: Transaction = {
      id: 'executive-surface',
      hash: '0xexec',
      timestamp: new Date('2026-04-16T15:07:15Z').getTime(),
      type: 'swap',
      from: '0xme',
      to: '0xme',
      asset: 'ETH',
      amount: 0.5,
      valueUsd: 1725,
      chain: 'ethereum',
      counterAsset: 'USDC',
      counterAmount: 1725,
    };

    const { container } = render(<TransactionList transactions={[tx]} surface="executive" />);

    expect(container.querySelector('.tx-list--executive')).toBeTruthy();
    expect(container.querySelector('.tx-card--executive')).toBeTruthy();
  });
});
