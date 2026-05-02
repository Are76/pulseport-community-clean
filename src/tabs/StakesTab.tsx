import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { StakesSection } from '../components/StakesSection';

interface StakesTabProps {
  selectedWalletAddr: string;
}

export function StakesTab({ selectedWalletAddr }: StakesTabProps) {
  const { wallets, prices, realStakes } = usePortfolio();
  const { currentAssets } = usePortfolioData();

  // ── Compute current stakes (filtered by active wallet) ────────────────────
  const currentStakes = useMemo(() => {
    if (wallets.length === 0) return [];
    const key = selectedWalletAddr === 'all' ? null : selectedWalletAddr.toLowerCase();
    return key
      ? realStakes.filter(s => s.walletAddress?.toLowerCase() === key)
      : realStakes;
  }, [wallets.length, selectedWalletAddr, realStakes]);

  // ── Compute liquid HEX/pHEX/eHEX across selected wallet(s) ──────────────
  const pHexLiquid = useMemo(() => {
    return currentAssets
      .filter(a =>
        a.chain === 'pulsechain' &&
        a.symbol.toLowerCase() === 'hex'
      )
      .reduce((sum, asset) => sum + asset.balance, 0);
  }, [currentAssets]);

  const eHexLiquid = useMemo(() => {
    const HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39';
    return currentAssets
      .filter(a =>
        (
          (a.chain === 'ethereum' && (a as any).address?.toLowerCase() === HEX_ADDR) ||
          (a.chain === 'pulsechain' && a.symbol.toLowerCase() === 'ehex')
        )
      )
      .reduce((sum, asset) => sum + asset.balance, 0);
  }, [currentAssets]);

  // ── Get HEX prices (pHEX and eHEX use same price; eHEX on Ethereum uses separate price) ────
  const hexUsdPrice = useMemo(() => {
    return (
      prices['pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd ||
      prices['pulsechain:hex']?.usd ||
      0
    );
  }, [prices]);

  const phexUsdPrice = useMemo(() => {
    return (
      prices['pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd ||
      prices['pulsechain:hex']?.usd ||
      0
    );
  }, [prices]);

  const ehexUsdPrice = useMemo(() => {
    return (
      prices['ethereum:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39']?.usd ||
      prices['hex']?.usd ||
      0
    );
  }, [prices]);

  // ── Build wallet labels mapping ───────────────────────────────────────────
  const walletLabels = useMemo(
    () => Object.fromEntries(wallets.filter(w => w.name).map(w => [w.address, w.name!])),
    [wallets]
  );

  return (
    <div className="stakes-page-shell">
      <StakesSection
        stakes={currentStakes}
        hexUsdPrice={hexUsdPrice}
        phexUsdPrice={phexUsdPrice}
        ehexUsdPrice={ehexUsdPrice}
        liquidPHex={pHexLiquid}
        liquidEHex={eHexLiquid}
        walletAddresses={wallets.map(w => w.address)}
        walletLabels={walletLabels}
      />
    </div>
  );
}
