import React from 'react';
import { MyInvestmentsAssetPanel } from '../components/my-investments/MyInvestmentsAssetPanel';
import { MyInvestmentsFilters } from '../components/my-investments/MyInvestmentsFilters';
import { MyInvestmentsHero } from '../components/my-investments/MyInvestmentsHero';
import { MyInvestmentsTable } from '../components/my-investments/MyInvestmentsTable';
import type { InvestmentHoldingRow } from '../types';

type InvestmentChainFilter = 'all' | 'pulsechain' | 'ethereum' | 'base';

/**
 * Props for the MyInvestmentsPage component.
 */
interface MyInvestmentsPageProps {
  /** Total amount of fiat invested across all holdings */
  investedFiat: number;

  /** Current total portfolio value in USD */
  currentValue: number;

  /** Liquid holdings value (not staked/locked) */
  liquidValue: number;

  /** Staked holdings value */
  stakedValue: number;

  /** Current PLS to USD exchange rate */
  plsUsdPrice: number;

  /** Array of investment holdings with detailed P&L data */
  rows: InvestmentHoldingRow[];

  /** Callback when transaction details are requested */
  onOpenTransactions: (row: InvestmentHoldingRow) => void;
}

/**
 * My Investments page displaying portfolio overview and detailed holdings.
 *
 * Shows total portfolio metrics (invested, current value, P&L) and a breakdown of holdings
 * by investment type with filtering by blockchain. Allows viewing transaction history for each position.
 *
 * @example
 * ```tsx
 * <MyInvestmentsPage
 *   investedFiat={50000}
 *   currentValue={75000}
 *   liquidValue={60000}
 *   stakedValue={15000}
 *   plsUsdPrice={0.0008}
 *   rows={investmentRows}
 *   onOpenTransactions={handleShowTransactions}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.investedFiat - Total invested fiat amount
 * @param props.currentValue - Current portfolio value
 * @param props.liquidValue - Liquid holdings value
 * @param props.stakedValue - Staked holdings value
 * @param props.plsUsdPrice - PLS/USD exchange rate
 * @param props.rows - Investment holdings data
 * @param props.onOpenTransactions - Callback for transaction requests
 * @returns The investments page component
 */
export function MyInvestmentsPage(props: MyInvestmentsPageProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = React.useState<InvestmentHoldingRow | null>(null);
  const [chainFilter, setChainFilter] = React.useState<InvestmentChainFilter>('all');
  const pnlUsd = props.currentValue - props.investedFiat;
  const pnlPercent = props.investedFiat > 0 ? (pnlUsd / props.investedFiat) * 100 : 0;
  const chainCounts = React.useMemo(() => ({
    all: props.rows.length,
    pulsechain: props.rows.filter((row) => row.chain === 'pulsechain').length,
    ethereum: props.rows.filter((row) => row.chain === 'ethereum').length,
    base: props.rows.filter((row) => row.chain === 'base').length,
  }), [props.rows]);
  const filteredRows = React.useMemo(
    () => chainFilter === 'all' ? props.rows : props.rows.filter((row) => row.chain === chainFilter),
    [chainFilter, props.rows],
  );

  React.useEffect(() => {
    if (expandedId && !filteredRows.some((row) => row.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, filteredRows]);

  React.useEffect(() => {
    if (selectedAsset && !filteredRows.some((row) => row.id === selectedAsset.id)) {
      setSelectedAsset(null);
    }
  }, [filteredRows, selectedAsset]);

  return (
    <div className="page-shell page-shell--spaced">
      <div>
        <MyInvestmentsHero
          investedFiat={props.investedFiat}
          currentValue={props.currentValue}
          pnlUsd={pnlUsd}
          pnlPercent={pnlPercent}
          liquidValue={props.liquidValue}
          stakedValue={props.stakedValue}
        />
      </div>
      <section className="control-bar" aria-label="Portfolio holdings controls">
        <div className="control-bar-title">
          <p className="control-bar-title-label">Portfolio</p>
          <h2 className="control-bar-title-heading">Holdings</h2>
        </div>
        <MyInvestmentsFilters
          activeFilter={chainFilter}
          counts={chainCounts}
          onChange={setChainFilter}
        />
      </section>
      <section className="table-wrapper" aria-label="Portfolio holdings workspace">
        <MyInvestmentsTable
          rows={filteredRows}
          plsUsdPrice={props.plsUsdPrice}
          portfolioValue={props.currentValue}
          expandedId={expandedId}
          onToggleRow={(id) => setExpandedId((current) => current === id ? null : id)}
          onOpenAsset={setSelectedAsset}
          onOpenTransactions={props.onOpenTransactions}
        />
      </section>
      {selectedAsset ? (
        <MyInvestmentsAssetPanel
          row={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onOpenTransactions={props.onOpenTransactions}
        />
      ) : null}
    </div>
  );
}

export type { MyInvestmentsPageProps };
