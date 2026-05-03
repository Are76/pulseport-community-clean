import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, History, TrendingUp } from 'lucide-react';
import type { Asset, Wallet } from '../types';
import { PulseBoardFeed } from '../components/PulseBoardFeed';

interface PortfolioSummary {
  totalValue: number;
  nativeValue: number;
  liquidValue: number;
  stakingValueUsd: number;
  pnl24h: number;
  pnl24hPercent: number;
  netInvestment: number;
  unifiedPnl: number;
  chainDistribution: Record<string, number>;
}

interface PortfolioPriceCard {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  accent: string;
  logo?: string;
}

type FrontMarketPeriod = '5m' | '1h' | '6h' | '24h' | '7d';

interface HomeTabProps {
  wallets: Wallet[];
  currentAssets: Asset[];
  summary: PortfolioSummary;
  topHoldingCards: PortfolioPriceCard[];
  tokenMarketData: Record<string, any>;
  tokenLogos: Record<string, string>;
  currentTransactions: any[];
  prices: Record<string, any>;
  setActiveTab: (tab: string) => void;
  setProfitPlannerOpen: (open: boolean) => void;
  openMarketWatch: (initialSearch: string) => void;
  getTokenLogoUrl: (asset: Asset) => string;
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

const MIN_INVESTMENT_THRESHOLD = 100;
const STATIC_LOGOS: Record<string, string> = {
  '0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c': 'https://s2.coinmarketcap.com/static/img/coins/64x64/9552.png',
  '0xa1077a294dde1b09bb078844df4512ec3f73a8f6': 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  '0xefccb9d8d9b6b76f85f3e0f8ec028facc415379b': 'https://s2.coinmarketcap.com/static/img/coins/64x64/6183.png',
};

const CHAIN_COLORS: Record<string, string> = {
  pulsechain: '#00FF9F',
  ethereum: '#627EEA',
  base: '#0052FF',
};

const FRONT_MARKET_PERIODS: FrontMarketPeriod[] = ['5m', '1h', '6h', '24h', '7d'];

export function HomeTab(props: HomeTabProps) {
  const [frontMarketPeriod, setFrontMarketPeriod] = useState<FrontMarketPeriod>('24h');

  const getFrontMarketChange = (marketData: any, _priceData: any, asset?: Asset | null): number | null => {
    if (frontMarketPeriod === '5m') return marketData?.priceChange5m ?? null;
    if (frontMarketPeriod === '1h') return marketData?.priceChange1h ?? _priceData?.usd_1h_change ?? asset?.priceChange1h ?? null;
    if (frontMarketPeriod === '6h') return marketData?.priceChange6h ?? null;
    if (frontMarketPeriod === '7d') return marketData?.priceChange7d ?? _priceData?.usd_7d_change ?? asset?.priceChange7d ?? null;
    return marketData?.priceChange24h ?? _priceData?.usd_24h_change ?? asset?.priceChange24h ?? null;
  };

  const fmtCompact = (n: number) =>
    n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` :
    n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` :
    n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` :
    n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  const fmtPrice = (p: number) => {
    if (p >= 1) return p.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    if (p >= 0.01) return p.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 });
    return p.toExponential(2);
  };

  const fmtMarket = (v?: number | null) =>
    v != null && v > 0
      ? v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : 'N/A';

  const frontPageGridTokens = useMemo<PortfolioPriceCard[]>(() => {
    const cards = new Map<string, PortfolioPriceCard>();
    const add = (card: PortfolioPriceCard) => {
      const key = card.symbol.toUpperCase();
      if (!cards.has(key)) cards.set(key, card);
    };

    props.topHoldingCards.forEach(add);

    const sourceAssets = props.currentAssets.length > 0 ? props.currentAssets : [];
    [...sourceAssets]
      .filter(asset => asset.value > 0)
      .sort((a, b) => b.value - a.value)
      .forEach(asset => {
        const logo = STATIC_LOGOS[(asset as any).address?.toLowerCase?.()] || (asset as any).logoUrl || props.tokenLogos[(asset as any).address?.toLowerCase?.()] || props.getTokenLogoUrl(asset);
        const chainColor = CHAIN_COLORS[asset.chain] || '#00FF9F';
        add({
          id: `${asset.chain}:${asset.symbol}`,
          symbol: asset.symbol,
          name: asset.name || asset.chain,
          price: asset.price,
          change24h: getFrontMarketChange(props.tokenMarketData[asset.id], null, asset),
          marketCap: props.tokenMarketData[asset.id]?.marketCap ?? props.tokenMarketData[asset.id]?.fdv ?? null,
          volume24h: props.tokenMarketData[asset.id]?.volume24h ?? null,
          accent: `linear-gradient(90deg, ${chainColor}, rgba(0,255,159,0.85))`,
          logo,
        });
      });

    return [...cards.values()].slice(0, 9);
  }, [props.topHoldingCards, props.currentAssets, props.tokenMarketData, props.tokenLogos, props.getTokenLogoUrl, frontMarketPeriod]);

  const frontPagePortfolioRows = useMemo(() => {
    const assets = props.currentAssets.length > 0 ? props.currentAssets : [];
    return assets
      .filter(asset => asset.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [props.currentAssets]);

  const frontPageChainRows = useMemo(() => {
    const entries = Object.entries(props.summary.chainDistribution)
      .map(([chain, value]) => ({ chain, value: value as number }))
      .filter(row => row.value > 0)
      .sort((a, b) => b.value - a.value);
    if (entries.length > 0) return entries;
    return [
      { chain: 'pulsechain', value: 74 },
      { chain: 'ethereum', value: 18 },
      { chain: 'base', value: 8 },
    ];
  }, [props.summary.chainDistribution]);

  const frontPagePulseTips = useMemo(() => {
    const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const latestPulseFlow = props.currentTransactions
      .filter(tx => tx.chain === 'pulsechain' && (tx.type === 'deposit' || tx.type === 'swap'))
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    const mover = [...props.topHoldingCards]
      .filter(token => token.change24h != null)
      .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))[0];
    const offChainCapital = props.currentAssets
      .filter(asset => asset.chain === 'ethereum' || asset.chain === 'base')
      .reduce((sum, asset) => sum + asset.value, 0);
    const largestHolding = frontPagePortfolioRows[0];

    return [
      latestPulseFlow ? {
        tag: 'Flow',
        title: `${latestPulseFlow.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${latestPulseFlow.asset} reached PulseChain`,
        body: latestPulseFlow.type === 'deposit'
          ? 'Fresh capital or bridged inventory just landed on PulseChain.'
          : 'A recent swap rotated capital into a new PulseChain position.',
        meta: dateFmt.format(new Date(latestPulseFlow.timestamp)),
      } : null,
      mover ? {
        tag: 'Momentum',
        title: `${mover.symbol} is moving the board`,
        body: `${mover.change24h! >= 0 ? '+' : ''}${mover.change24h!.toFixed(2)}% on the active PulseBoard window.`,
        meta: 'PulseBoard',
      } : null,
      offChainCapital > 0 ? {
        tag: 'Bridge watch',
        title: `$${offChainCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })} still sits on Ethereum or Base`,
        body: 'There is still capital outside PulseChain if you want to watch new bridge arrivals.',
        meta: 'Cross-chain',
      } : null,
      largestHolding ? {
        tag: 'Concentration',
        title: `${largestHolding.symbol} is still the anchor position`,
        body: `${((largestHolding.value / Math.max(props.summary.totalValue, 1)) * 100).toFixed(1)}% of current net worth is concentrated in this coin.`,
        meta: 'Allocation',
      } : null,
    ].filter(Boolean) as Array<{ tag: string; title: string; body: string; meta: string }>;
  }, [props.currentAssets, props.currentTransactions, frontPagePortfolioRows, props.summary.totalValue, props.topHoldingCards]);

  const frontPageMarketStats = useMemo(() => {
    const totalVolume = props.topHoldingCards.reduce((sum, token) => sum + (token.volume24h || 0), 0);
    const pulseCoins = props.topHoldingCards.filter(token => token.id !== 'eHEX');
    const strongest = [...props.topHoldingCards]
      .filter(token => token.change24h != null)
      .sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity))[0];
    const weakest = [...props.topHoldingCards]
      .filter(token => token.change24h != null)
      .sort((a, b) => (a.change24h ?? Infinity) - (b.change24h ?? Infinity))[0];

    return [
      {
        label: 'Core Pulse assets',
        value: `${pulseCoins.length}`,
        detail: 'PLS, PLSX, HEX, INC, PRVX',
      },
      {
        label: 'Tracked 24h volume',
        value: totalVolume > 0 ? `$${fmtCompact(totalVolume)}` : 'Syncing',
        detail: 'Across live core pairs',
      },
      {
        label: 'Strongest today',
        value: strongest ? strongest.symbol : 'Live',
        detail: strongest?.change24h != null ? `${strongest.change24h >= 0 ? '+' : ''}${strongest.change24h.toFixed(2)}%` : 'Waiting for market data',
      },
      {
        label: 'Needs attention',
        value: weakest ? weakest.symbol : 'Wallet',
        detail: weakest?.change24h != null ? `${weakest.change24h >= 0 ? '+' : ''}${weakest.change24h.toFixed(2)}%` : 'Paste one address to start',
      },
    ];
  }, [props.topHoldingCards]);

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="premium-home"
    >
      <section className="premium-home-hero">
        <div className="premium-home-stack">
          <div className="premium-home-value-card">
            <span className="premium-home-kicker">My Net Worth</span>
            <strong>${props.summary.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
            <small>
              {props.summary.netInvestment > MIN_INVESTMENT_THRESHOLD
                ? `Invested fiat $${Math.abs(props.summary.netInvestment).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                : 'Add a wallet to map invested fiat against PulseChain holdings'}
            </small>
            <div className="premium-home-stat-grid">
              <div>
                <span>Net P&L</span>
                <strong className={props.summary.unifiedPnl >= 0 ? 'is-up' : 'is-down'}>
                  {props.summary.netInvestment > MIN_INVESTMENT_THRESHOLD
                    ? `${props.summary.unifiedPnl >= 0 ? '+' : '-'}$${Math.abs(props.summary.unifiedPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : '-'}
                </strong>
                {props.summary.netInvestment > MIN_INVESTMENT_THRESHOLD && (
                  <small className="premium-home-stat-note">
                    {props.summary.unifiedPnl >= 0 ? '+' : '-'}{Math.abs((props.summary.unifiedPnl / props.summary.netInvestment) * 100).toFixed(1)}% vs invested
                  </small>
                )}
              </div>
              <div>
                <span>24h move</span>
                <strong className={props.summary.pnl24h >= 0 ? 'is-up' : 'is-down'}>
                  {props.summary.pnl24h >= 0 ? '+' : '-'}${Math.abs(props.summary.pnl24h).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div>
                <span>Liquid</span>
                <strong>${props.summary.liquidValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
              </div>
              <div>
                <span>Staked</span>
                <strong>${props.summary.stakingValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
            <div className="premium-home-actions">
              <button className="btn-primary front-primary-action" onClick={() => props.setActiveTab('pulsechain-official')}>
                My Investments <ArrowRight size={15} />
              </button>
              <button className="btn-ghost front-secondary-action" onClick={() => props.setActiveTab('history')}>
                Transactions <History size={14} />
              </button>
              <button className="btn-ghost front-secondary-action" onClick={() => props.setProfitPlannerOpen(true)}>
                Profit Planner <TrendingUp size={14} />
              </button>
            </div>
          </div>

          <div className="premium-home-panel premium-home-panel--allocation">
            <div className="premium-home-panel-head">
              <div>
                <span>Portfolio mix</span>
                <h2>Weight, concentration, and dominant positions.</h2>
              </div>
            </div>
            {(() => {
              const allocationColors = ['#00d68f', '#7c5cff', '#f739ff', '#fb923c', '#60a5fa', '#94a3b8'];
              const allocationRows = frontPagePortfolioRows.slice(0, 5);
              const otherValue = Math.max(0, frontPagePortfolioRows.slice(5).reduce((sum, asset) => sum + asset.value, 0));
              const totalValue = Math.max(props.summary.totalValue, allocationRows.reduce((sum, asset) => sum + asset.value, 0) + otherValue);
              const allocationData = [
                ...allocationRows.map((asset, index) => ({
                  label: asset.symbol,
                  detail: asset.name,
                  value: asset.value,
                  color: allocationColors[index % allocationColors.length],
                })),
                ...(otherValue > 0 ? [{ label: 'Other', detail: 'Remaining holdings', value: otherValue, color: allocationColors[5] }] : []),
              ];

              return (
                <>
                  {allocationData[0] ? (
                    <div className="front-allocation-hero">
                      <div className="front-allocation-hero__copy">
                        <span>Largest position</span>
                        <strong>{allocationData[0].label}</strong>
                        <small>{allocationData[0].detail}</small>
                      </div>
                      <div className="front-allocation-hero__value">
                        <strong>${allocationData[0].value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
                        <small>{((allocationData[0].value / totalValue) * 100).toFixed(1)}% of net worth</small>
                      </div>
                    </div>
                  ) : null}
                  <div className="front-allocation-stack">
                    {allocationData.map((entry) => {
                      const share = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                      return (
                        <div className="front-allocation-band" key={entry.label}>
                          <div className="front-allocation-band__rail">
                            <div className="front-allocation-band__fill" style={{ width: `${Math.max(share, 6)}%`, background: entry.color }} />
                          </div>
                          <div className="front-allocation-band__meta">
                            <strong>{entry.label}</strong>
                            <small>{entry.detail}</small>
                          </div>
                          <div className="front-allocation-band__value">
                            <strong>${entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
                            <small>{share.toFixed(1)}%</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="premium-home-market">
          <div className="premium-home-panel-head premium-home-panel-head--market">
            <div>
              <span>PulseBoard</span>
              <h2>Core PulseChain price grid</h2>
            </div>
            <div className="front-time-tabs">
              {FRONT_MARKET_PERIODS.map(label => (
                <button
                  type="button"
                  key={label}
                  className={frontMarketPeriod === label ? 'active' : ''}
                  onClick={() => setFrontMarketPeriod(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="front-price-grid front-price-grid--premium">
            {frontPageGridTokens.slice(0, 8).map((token, i) => {
              const changeClass = (token.change24h ?? 0) >= 0 ? 'is-up' : 'is-down';
              return (
                <button
                  key={`${token.id}-${i}`}
                  className="front-price-box"
                  onClick={() => props.openMarketWatch(token.symbol)}
                  style={{ animationDelay: `${i * 32}ms` }}
                >
                  <span className="front-price-accent" style={{ background: token.accent }} />
                  <span className="front-price-head">
                    <span className="front-price-topline">
                      <span className="front-token-logo">{token.logo ? <img src={token.logo} alt={token.symbol} /> : token.symbol.slice(0, 1)}</span>
                      <span>
                        <strong>{token.symbol}</strong>
                        <small>{token.name}</small>
                      </span>
                    </span>
                    <small className={`front-price-chip ${changeClass}`}>
                      {token.change24h == null ? 'Live' : `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}% ${frontMarketPeriod}`}
                    </small>
                  </span>
                  <span className="front-price-main">
                    <strong>{fmtPrice(token.price)}</strong>
                    <small>PulseChain market</small>
                  </span>
                  <span className="front-price-footer">
                    <span className="front-price-stat">
                      <small>Market cap</small>
                      <strong>{fmtMarket(token.marketCap)}</strong>
                    </span>
                    <span className="front-price-stat">
                      <small>Volume 24h</small>
                      <strong>{fmtMarket(token.volume24h)}</strong>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <PulseBoardFeed items={frontPagePulseTips} />
        </div>
      </section>

      <section className="premium-home-lower premium-home-lower--single">
        <div className="premium-home-panel premium-home-panel--intel">
          <div className="premium-home-panel-head">
            <div>
              <span>Market pulse</span>
              <h2>What matters across the chain right now.</h2>
            </div>
          </div>
          <div className="front-pulse-grid">
            {frontPageMarketStats.map(stat => (
              <div className="front-pulse-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            ))}
          </div>
          <div className="front-chain-stack">
            {frontPageChainRows.map(row => {
              const pct = props.summary.totalValue > 0 ? (row.value / props.summary.totalValue) * 100 : row.value;
              const chainColor = CHAIN_COLORS[row.chain] || 'var(--accent)';
              return (
                <div className="front-chain-row" key={row.chain}>
                  <div>
                    <span style={{ background: chainColor }} />
                    <strong>{row.chain.charAt(0).toUpperCase() + row.chain.slice(1)}</strong>
                  </div>
                  <small>{Math.max(0, pct).toFixed(1)}%</small>
                  <em><i style={{ width: `${Math.min(100, Math.max(4, pct))}%`, background: chainColor }} /></em>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
