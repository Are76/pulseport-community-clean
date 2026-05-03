import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Asset, Wallet, HexStake } from '../types';
import { LiquidityOverviewStrip } from '../components/LiquiditySection';

interface PortfolioSummary {
  totalValue: number;
  nativeValue: number;
  liquidValue: number;
  stakingValueUsd: number;
  pnl24h: number;
  pnl24hPercent: number;
  netInvestment: number;
  unifiedPnl: number;
  realizedPnl: number;
  chainDistribution: Record<string, number>;
}

interface OverviewTabProps {
  wallets: Wallet[];
  currentAssets: Asset[];
  currentStakes: HexStake[];
  summary: PortfolioSummary;
  tokenPrices: Record<string, any>;
  setActiveTab: (tab: string) => void;
  t: {
    green: string;
    red: string;
    card: string;
    border: string;
    cardHigh: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    expandedBg: string;
    borderLight: string;
  };
}

function fmtPrice(val: number, decimals = 2): string {
  if (val === 0) return '0.00';
  const abs = Math.abs(val);
  if (abs >= 1) {
    return val.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 2 });
  } else if (abs >= 0.01) {
    return val.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 2 });
  } else if (abs >= 0.0001) {
    return val.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 4 });
  } else {
    return val.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 6 });
  }
}

function fmtNum(val: number): string {
  return val.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export function OverviewTab(props: OverviewTabProps) {
  const MAX_HERO_HOLDINGS = 7;
  const holdingAssets = useMemo(() => [...props.currentAssets].sort((a, b) => b.value - a.value).slice(0, MAX_HERO_HOLDINGS), [props.currentAssets]);

  const hexStakesInfo = useMemo(() => {
    const PHEX_YIELD_PER_TSHARE = 2.5;
    const EHEX_YIELD_PER_TSHARE = 2.0;

    let pHexAmount = 0;
    let eHexAmount = 0;
    let pHexValue = 0;
    let eHexValue = 0;
    let pHexPrincipal = 0;
    let pHexYield = 0;
    let eHexPrincipal = 0;
    let eHexYield = 0;

    props.currentStakes.forEach(stake => {
      if ((stake.daysRemaining ?? 0) <= 0) return; // skip ended stakes

      const hexPriceKey = `${stake.chain}:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39`;
      const chainHexFallback = stake.chain === 'pulsechain' ? props.tokenPrices['pulsechain:hex']?.usd : props.tokenPrices['hex']?.usd;
      const hexPrice = props.tokenPrices[hexPriceKey]?.usd || chainHexFallback || 0;

      const stakedHex = Number(stake.stakedHearts ?? 0n) / 1e8;
      const tShares = Number(stake.stakeShares ?? 0n) / 1e12;
      const daysStaked = Math.max(0, (stake.stakedDays ?? 0) - (stake.daysRemaining ?? 0));
      const rate = stake.chain === 'pulsechain' ? PHEX_YIELD_PER_TSHARE : EHEX_YIELD_PER_TSHARE;
      const interestHex = tShares * daysStaked * rate;

      const stakeValue = (stakedHex + interestHex) * hexPrice;

      if (stake.chain === 'pulsechain') {
        pHexAmount += stakedHex + interestHex;
        pHexValue += stakeValue;
        pHexPrincipal += stakedHex * hexPrice;
        pHexYield += interestHex * hexPrice;
      } else {
        eHexAmount += stakedHex + interestHex;
        eHexValue += stakeValue;
        eHexPrincipal += stakedHex * hexPrice;
        eHexYield += interestHex * hexPrice;
      }
    });

    return { pHexAmount, eHexAmount, pHexValue, eHexValue, pHexPrincipal, pHexYield, eHexPrincipal, eHexYield };
  }, [props.currentStakes, props.tokenPrices]);

  const pnlChangeColor = props.summary.unifiedPnl >= 0 ? props.t.green : props.t.red;
  const pnl24hChangeColor = props.summary.pnl24h >= 0 ? props.t.green : props.t.red;

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="overview-page-shell space-y-4"
      style={{ width: '100%', minWidth: 1 }}
    >
      {/* MY NET WORTH Section */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MY NET WORTH</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: props.t.text, marginBottom: '8px' }}>
          ${fmtNum(props.summary.totalValue)}
        </div>
        <div style={{ fontSize: '13px', color: pnl24hChangeColor, fontWeight: 500 }}>
          {props.summary.pnl24h >= 0 ? '+' : ''}{fmtPrice(props.summary.pnl24h, 2)} ({props.summary.pnl24hPercent >= 0 ? '+' : ''}{props.summary.pnl24hPercent.toFixed(2)}%) in 24h
        </div>
      </div>

      {/* Asset Breakdown Section */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ASSET BREAKDOWN</div>
        <div className="space-y-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${props.t.border}` }}>
            <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>Liquid Assets</span>
            <span style={{ color: props.t.text, fontSize: '14px', fontWeight: 500 }}>${fmtNum(props.summary.liquidValue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${props.t.border}` }}>
            <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>Staked Assets</span>
            <span style={{ color: props.t.text, fontSize: '14px', fontWeight: 500 }}>${fmtNum(props.summary.stakingValueUsd)}</span>
          </div>
          {hexStakesInfo.pHexAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${props.t.border}` }}>
              <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>pHEX</span>
              <span style={{ color: props.t.text, fontSize: '14px', fontWeight: 500 }}>${fmtNum(hexStakesInfo.pHexValue)}</span>
            </div>
          )}
          {hexStakesInfo.eHexAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>eHEX</span>
              <span style={{ color: props.t.text, fontSize: '14px', fontWeight: 500 }}>${fmtNum(hexStakesInfo.eHexValue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* TRACKED CAPITAL Section */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRACKED CAPITAL</div>
        <div style={{ fontSize: '24px', fontWeight: 600, color: props.t.text }}>
          ${fmtNum(props.summary.netInvestment)}
        </div>
        <div style={{ fontSize: '12px', color: props.t.textMuted, marginTop: '6px' }}>Total capital tracked from deposits</div>
      </div>

      {/* TOTAL PnL Section */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL PnL</div>
        <div className="space-y-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${props.t.border}` }}>
            <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>Unrealized PnL</span>
            <span style={{ color: pnlChangeColor, fontSize: '14px', fontWeight: 500 }}>
              {props.summary.unifiedPnl >= 0 ? '+' : ''}{fmtPrice(props.summary.unifiedPnl, 2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: props.t.textSecondary, fontSize: '13px' }}>Realized PnL</span>
            <span style={{ color: props.summary.realizedPnl >= 0 ? props.t.green : props.t.red, fontSize: '14px', fontWeight: 500 }}>
              {props.summary.realizedPnl >= 0 ? '+' : ''}{fmtPrice(props.summary.realizedPnl, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* HEX POSITIONING Section */}
      {(hexStakesInfo.pHexAmount > 0 || hexStakesInfo.eHexAmount > 0) && (
        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HEX POSITIONING</div>
          <div className="space-y-4">
            {hexStakesInfo.pHexAmount > 0 && (
              <div style={{ paddingBottom: '16px', borderBottom: `1px solid ${props.t.border}` }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: props.t.text, marginBottom: '8px' }}>pHEX (Pulsechain)</div>
                <div className="space-y-2">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Amount</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>{fmtNum(hexStakesInfo.pHexAmount)} HEX</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Value</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>${fmtNum(hexStakesInfo.pHexValue)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: props.t.textMuted }}>
                    <span>Principal</span>
                    <span>${fmtNum(hexStakesInfo.pHexPrincipal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: props.t.textMuted }}>
                    <span>Accrued Yield</span>
                    <span>${fmtNum(hexStakesInfo.pHexYield)}</span>
                  </div>
                </div>
              </div>
            )}
            {hexStakesInfo.eHexAmount > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: props.t.text, marginBottom: '8px' }}>eHEX (Ethereum)</div>
                <div className="space-y-2">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Amount</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>{fmtNum(hexStakesInfo.eHexAmount)} HEX</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Value</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>${fmtNum(hexStakesInfo.eHexValue)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: props.t.textMuted }}>
                    <span>Principal</span>
                    <span>${fmtNum(hexStakesInfo.eHexPrincipal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: props.t.textMuted }}>
                    <span>Accrued Yield</span>
                    <span>${fmtNum(hexStakesInfo.eHexYield)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liquidity Overview */}
      <LiquidityOverviewStrip
        walletAddresses={props.wallets.map(w => w.address)}
        tokenPrices={props.tokenPrices}
        onViewAll={() => props.setActiveTab('stakes')}
      />

      {/* Top Holdings */}
      {holdingAssets.length > 0 && (
        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text, marginBottom: '16px' }}>Top Holdings</div>
          <div className="space-y-2">
            {holdingAssets.slice(0, 5).map((asset) => (
              <div key={asset.id || `${asset.symbol}-${asset.chain}`} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: props.t.card,
                borderRadius: '8px',
                fontSize: '14px',
              }}>
                <span style={{ color: props.t.text }}>{asset.symbol}</span>
                <span style={{ color: props.t.textSecondary }}>${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
