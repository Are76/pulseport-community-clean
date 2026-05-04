import React from 'react';
import { ContextActionStrip, PageHero, SectionFrame } from '../components/dashboard-shell';
import { MyInvestmentsAssetPanel } from '../components/my-investments/MyInvestmentsAssetPanel';
import { MyInvestmentsFilters } from '../components/my-investments/MyInvestmentsFilters';
import { MyInvestmentsHero } from '../components/my-investments/MyInvestmentsHero';
import { MyInvestmentsTable } from '../components/my-investments/MyInvestmentsTable';
import type { InvestmentHoldingRow } from '../types';

type InvestmentChainFilter = 'all' | 'pulsechain' | 'ethereum' | 'base';

interface MyInvestmentsPageProps {
  investedFiat: number;
  currentValue: number;
  liquidValue: number;
  stakedValue: number;
  plsUsdPrice: number;
  rows: InvestmentHoldingRow[];
  onOpenTransactions: (row: InvestmentHoldingRow) => void;
}

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
  const activeChainCount = React.useMemo(
    () => [chainCounts.pulsechain, chainCounts.ethereum, chainCounts.base].filter((count) => count > 0).length,
    [chainCounts],
  );
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
    <div className="mi-page">
      <PageHero
        eyebrow="Canonical cost-basis ledger"
        title="My Investments"
        description="Executive framing for the live bag, with invested fiat, source routes, and row-level drilldowns preserved as the canonical ledger."
      >
        <MyInvestmentsHero
          investedFiat={props.investedFiat}
          currentValue={props.currentValue}
          pnlUsd={pnlUsd}
          pnlPercent={pnlPercent}
          liquidValue={props.liquidValue}
          stakedValue={props.stakedValue}
        />
      </PageHero>
      <ContextActionStrip title="Ledger context" label="My Investments ledger context">
        <article className="mi-context-card">
          <span className="mi-label">Rows in scope</span>
          <strong>{filteredRows.length}</strong>
          <p>Every position keeps its original cost basis, source mix, and transaction handoff intact.</p>
        </article>
        <article className="mi-context-card">
          <span className="mi-label">Active chains</span>
          <strong>{activeChainCount}</strong>
          <p>Filter the current bag across PulseChain, Ethereum, and Base without altering ledger math.</p>
        </article>
        <article className="mi-context-card">
          <span className="mi-label">Primary mode</span>
          <strong>{chainFilter === 'all' ? 'Unified board' : `${chainFilter} only`}</strong>
          <p>Use the holdings ledger below to open route context, attribution, and transaction detail.</p>
        </article>
      </ContextActionStrip>
      <SectionFrame
        title="Holdings ledger"
        description="Filter the live bag by chain, then open a row for source capital, P&L, and route context."
        actions={(
          <MyInvestmentsFilters
            activeFilter={chainFilter}
            counts={chainCounts}
            onChange={setChainFilter}
            showHeading={false}
          />
        )}
      >
        <MyInvestmentsTable
          rows={filteredRows}
          plsUsdPrice={props.plsUsdPrice}
          portfolioValue={props.currentValue}
          expandedId={expandedId}
          onToggleRow={(id) => setExpandedId((current) => current === id ? null : id)}
          onOpenAsset={setSelectedAsset}
          onOpenTransactions={props.onOpenTransactions}
        />
      </SectionFrame>
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
