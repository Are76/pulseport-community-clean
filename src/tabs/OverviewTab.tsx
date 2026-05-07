import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Asset, Wallet, HexStake, PortfolioSummary, ThemeColors } from '../types';
import { fmtPrice, fmtNum, fmtAmount } from '../utils/formatting';
import { LiquidityOverviewStrip } from '../components/LiquiditySection';

interface OverviewTabProps {
  wallets: Wallet[];
  currentAssets: Asset[];
  currentStakes: HexStake[];
  summary: PortfolioSummary;
  tokenPrices: Record<string, any>;
  setActiveTab: (tab: string) => void;
  t: ThemeColors;
}

export function OverviewTab(props: OverviewTabProps) {
  const MAX_HERO_HOLDINGS = 7;
  const holdingAssets = useMemo(() => [...props.currentAssets].sort((a, b) => b.value - a.value).slice(0, MAX_HERO_HOLDINGS), [props.currentAssets]);

  // Empty state: no wallets connected
  if (props.wallets.length === 0) {
    return (
      <motion.div
        key="overview-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="page-shell"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '500px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: props.t.text, marginBottom: '12px' }}>
            No Wallets Connected
          </div>
          <div style={{ fontSize: '14px', color: props.t.textMuted }}>
            Add a wallet from the sidebar to view your portfolio, holdings, and performance metrics.
          </div>
        </div>
      </motion.div>
    );
  }

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
    let pHexLiquid = 0;
    let eHexLiquid = 0;

    // Add liquid HEX holdings
    props.currentAssets.forEach(asset => {
      if (asset.chain === 'pulsechain' && asset.symbol.toLowerCase() === 'hex') {
        pHexLiquid += asset.balance;
      }
      const HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';
      if ((asset.chain === 'ethereum' && (asset as any).address?.toLowerCase() === HEX_ADDR) ||
          (asset.chain === 'pulsechain' && asset.symbol.toLowerCase() === 'ehex')) {
        eHexLiquid += asset.balance;
      }
    });

    props.currentStakes.forEach(stake => {
      if ((stake.daysRemaining ?? 0) <= 0) return;

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

    return {
      pHexAmount, eHexAmount, pHexValue, eHexValue, pHexPrincipal, pHexYield, eHexPrincipal, eHexYield,
      pHexLiquid, eHexLiquid, pHexStaked: pHexAmount, eHexStaked: eHexAmount
    };
  }, [props.currentAssets, props.currentStakes, props.tokenPrices]);

  const pnlChangeColor = props.summary.unifiedPnl >= 0 ? props.t.green : props.t.red;
  const pnl24hChangeColor = props.summary.pnl24h >= 0 ? props.t.green : props.t.red;

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-shell page-shell--spaced"
    >
      {/* Hero Card - MY NET WORTH */}
      <div style={{
        background: props.t.card,
        border: `1px solid ${props.t.border}`,
        borderRadius: '12px',
        padding: '32px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>MY NET WORTH</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: props.t.text }}>
              ${fmtNum(props.summary.totalValue)}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: pnl24hChangeColor }}>
              {props.summary.pnl24h >= 0 ? '+' : ''}{fmtPrice(props.summary.pnl24h)} / {props.summary.pnl24hPercent >= 0 ? '+' : ''}{props.summary.pnl24hPercent.toFixed(2)}%
            </div>
          </div>
          <div style={{ fontSize: '14px', color: props.t.textSecondary }}>
            {fmtNum(props.summary.nativeValue)} PLS tracked
          </div>
        </div>

        {/* Asset breakdown row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${props.t.border}`,
        }}>
          <div>
            <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '6px' }}>Liquid</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text }}>${fmtNum(props.summary.liquidValue)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '6px' }}>Staked</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text }}>${fmtNum(props.summary.stakingValueUsd)}</div>
          </div>
          {hexStakesInfo.pHexAmount > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '6px' }}>pHEX</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text }}>{fmtAmount(hexStakesInfo.pHexAmount)}</div>
            </div>
          )}
          {hexStakesInfo.eHexAmount > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '6px' }}>eHEX</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: props.t.text }}>{fmtAmount(hexStakesInfo.eHexAmount)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout: TRACKED CAPITAL and TOTAL PnL */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>TRACKED CAPITAL</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: props.t.text, marginBottom: '8px' }}>
            ${fmtNum(props.summary.netInvestment)}
          </div>
          <div style={{ fontSize: '13px', color: props.t.textMuted }}>ETH + stablecoin inflows</div>
        </div>

        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>TOTAL PnL</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: pnlChangeColor, marginBottom: '8px' }}>
            {props.summary.unifiedPnl >= 0 ? '+' : ''}{fmtPrice(props.summary.unifiedPnl)}
          </div>
          <div style={{ fontSize: '13px', color: props.t.textMuted }}>
            {props.summary.netInvestment > 0 ? ((props.summary.unifiedPnl / props.summary.netInvestment) * 100).toFixed(1) : '0.0'}% vs invested
          </div>
        </div>
      </div>

      {/* HEX POSITIONING Section */}
      {(hexStakesInfo.pHexAmount > 0 || hexStakesInfo.eHexAmount > 0) && (
        <div style={{
          background: props.t.card,
          border: `1px solid ${props.t.border}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>HEX POSITIONING</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: props.t.text }}>My HEX Holdings</div>
          </div>

          {/* Total PHEX and EHEX row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: `1px solid ${props.t.border}`,
          }}>
            {hexStakesInfo.pHexAmount > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
                  TOTAL PHEX
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#F59E0B', marginBottom: '8px' }}>
                  {fmtNum(hexStakesInfo.pHexAmount)}
                </div>
                <div style={{ fontSize: '14px', color: props.t.text, marginBottom: '8px', fontWeight: 500 }}>
                  ${fmtNum(hexStakesInfo.pHexValue)}
                </div>
                <div style={{ fontSize: '12px', color: props.t.textMuted }}>
                  {fmtNum(hexStakesInfo.pHexLiquid)} liquid - {fmtNum(hexStakesInfo.pHexStaked)} staked
                </div>
              </div>
            )}
            {hexStakesInfo.eHexAmount > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: props.t.textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }}></div>
                  TOTAL EHEX
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#6366F1', marginBottom: '8px' }}>
                  {fmtNum(hexStakesInfo.eHexAmount)}
                </div>
                <div style={{ fontSize: '14px', color: props.t.text, marginBottom: '8px', fontWeight: 500 }}>
                  ${fmtNum(hexStakesInfo.eHexValue)}
                </div>
                <div style={{ fontSize: '12px', color: props.t.textMuted }}>
                  {fmtNum(hexStakesInfo.eHexLiquid)} liquid - {fmtNum(hexStakesInfo.eHexStaked)} staked
                </div>
              </div>
            )}
          </div>

          {/* Stake breakdown */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: props.t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>STAKE BREAKDOWN - PRINCIPAL + ACCRUED YIELD</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
          }}>
            {hexStakesInfo.pHexAmount > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#F59E0B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.5px' }}>PHEX STAKED</div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Principal</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>${fmtNum(hexStakesInfo.pHexPrincipal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Accrued Yield</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>+${fmtNum(hexStakesInfo.pHexYield)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '8px', borderTop: `1px solid ${props.t.border}` }}>
                    <span style={{ color: props.t.text, fontWeight: 600 }}>Total</span>
                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>{fmtNum(hexStakesInfo.pHexAmount)}</span>
                  </div>
                </div>
              </div>
            )}
            {hexStakesInfo.eHexAmount > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#6366F1', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.5px' }}>EHEX STAKED</div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Principal</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>${fmtNum(hexStakesInfo.eHexPrincipal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: props.t.textSecondary }}>Accrued Yield</span>
                    <span style={{ color: props.t.text, fontWeight: 500 }}>+${fmtNum(hexStakesInfo.eHexYield)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '8px', borderTop: `1px solid ${props.t.border}` }}>
                    <span style={{ color: props.t.text, fontWeight: 600 }}>Total</span>
                    <span style={{ color: '#6366F1', fontWeight: 700 }}>{fmtNum(hexStakesInfo.eHexAmount)}</span>
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
                <span style={{ color: props.t.textSecondary }}>${isFinite(asset.value) ? asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
