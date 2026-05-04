import React, { useState } from 'react';
import type { Asset, HistoryPoint, InvestmentHoldingRow, Transaction } from '../types';
import { MyInvestmentsPage } from './MyInvestmentsPage';
import { ProfitPlannerModal } from '../components/ProfitPlannerModal';

type SubTab = 'investments' | 'planner';

interface Props {
  assets: Asset[];
  history: HistoryPoint[];
  transactions: Transaction[];
  investmentRows: InvestmentHoldingRow[];
  investedFiat?: number;
  currentValue?: number;
  liquidValue?: number;
  stakedValue?: number;
  plsUsdPrice?: number;
  onOpenTransactions?: (row: InvestmentHoldingRow) => void;
}

export function WalletAnalyzer({
  assets,
  history,
  transactions,
  investmentRows,
  investedFiat = 0,
  currentValue = 0,
  liquidValue  = 0,
  stakedValue  = 0,
  plsUsdPrice  = 0,
  onOpenTransactions = () => {},
}: Props) {
  const [subTab, setSubTab]       = useState<SubTab>('investments');

  const totalValue = assets.reduce((s, a) => s + (a.value ?? 0), 0);

  return (
    <div className="page-shell page-shell--with-header">

      {/* Header */}
      <div className="page-header-content">
        <p className="page-kicker">Wallet Analyzer</p>
        <h1 className="page-title">Portfolio Hub</h1>
        <p className="page-subtitle">Investments and profit planning across all wallets.</p>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'investments' as const, label: 'Investments' },
          { id: 'planner' as const, label: 'Profit Planner' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: 13,
              fontWeight: subTab === t.id ? 600 : 400,
              borderRadius: '6px 6px 0 0',
              border: 'none',
              background: subTab === t.id ? 'var(--bg-elevated)' : 'transparent',
              color: subTab === t.id ? 'var(--fg)' : 'var(--fg-muted)',
              cursor: 'pointer',
              borderBottom: subTab === t.id ? '2px solid var(--shell-accent, #8b5cf6)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── INVESTMENTS sub-tab ─── */}
      {subTab === 'investments' && (
        <MyInvestmentsPage
          investedFiat={investedFiat}
          currentValue={currentValue}
          liquidValue={liquidValue}
          stakedValue={stakedValue}
          plsUsdPrice={plsUsdPrice}
          rows={investmentRows}
          onOpenTransactions={onOpenTransactions}
        />
      )}

      {/* ─── PLANNER sub-tab ─── */}
      {subTab === 'planner' && (
        <ProfitPlannerModal
          open={true}
          onClose={() => setSubTab('investments')}
          assets={assets}
          totalValue={totalValue}
          inline
        />
      )}

    </div>
  );
}
