import React from 'react';
import { Calculator, ChevronDown, ChevronUp, Copy, ExternalLink, MinusCircle, PlusCircle } from 'lucide-react';
import { CHAIN_COLORS } from '../utils/appConstants';

/**
 * A single coin/asset item in the CoinList.
 * @example
 * { id: 'pls', symbol: 'PLS', name: 'PulseChain', chain: 'pulsechain', balance: 1000, value: 5 }
 */
export interface CoinListItem {
  /** Unique identifier for the coin */
  id: string;

  /** Full name of the coin (e.g., "Ethereum") */
  name: string;

  /** Symbol/ticker (e.g., "ETH") */
  symbol: string;

  /** Blockchain network (e.g., "ethereum", "pulsechain") */
  chain: string;

  /** Optional logo/icon URL */
  logoUrl?: string;

  /** Current price in USD */
  priceUsd: number;

  /** Optional price in PLS */
  pricePls?: number;

  /** 24-hour price change percentage */
  change24h?: number;

  /** User's token balance */
  balance: number;

  /** Total value in USD (balance * priceUsd) */
  valueUsd: number;

  /** Optional total value in PLS */
  valuePls?: number;

  /** Optional liquidity in USD */
  liquidityUsd?: number;

  /** Optional 24-hour volume in USD */
  volume24hUsd?: number;

  /** Optional number of liquidity pools */
  pools?: number | null;

  /** Optional cost basis in USD for P&L calculation */
  costBasisUsd?: number;

  /** Optional profit/loss in USD */
  pnlUsd?: number;

  /** Optional profit/loss percentage */
  pnlPercent?: number;

  /** Optional smart contract address */
  contractAddress?: string;

  /** Optional metadata string */
  meta?: string;

  /** Optional array of tags for categorization */
  tags?: string[];
}

type SortField = 'priceUsd' | 'change24h' | 'valueUsd';

/**
 * Props for the CoinList component.
 */
interface CoinListProps {
  /** Array of coin items to display */
  items: CoinListItem[];

  /** Display variant: 'compact' for minimal info or 'detailed' for full info (default: 'detailed') */
  variant?: 'compact' | 'detailed';

  /** Custom message when the list is empty (default: 'No assets found.') */
  emptyMessage?: string;

  /** ID of currently expanded row (for compact variant) */
  expandedId?: string | null;

  /** Callback when expand/collapse button is clicked */
  onToggleExpanded?: (id: string) => void;

  /** Callback when a row is clicked */
  onRowClick?: (item: CoinListItem) => void;

  /** Optional render function for expanded row content */
  renderExpanded?: (item: CoinListItem) => React.ReactNode;

  /** Callback to copy contract address to clipboard */
  onCopyContract?: (item: CoinListItem) => void;

  /** Callback to open external link (explorer, chart, etc.) */
  onOpenExternal?: (item: CoinListItem) => void;

  /** Callback to open calculator for the coin */
  onCalculator?: (item: CoinListItem) => void;

  /** Callback to add coin to watchlist or portfolio */
  onAdd?: (item: CoinListItem) => void;

  /** Callback to remove coin from list */
  onRemove?: (item: CoinListItem) => void;
}

const formatPrice = (value: number) => {
  if (!value) return '$0.00';
  if (value < 0.00001) return `$${value.toFixed(10)}`;
  if (value < 0.001) return `$${value.toFixed(8)}`;
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const formatUsd = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const formatCompactUsd = (value?: number) => {
  if (!value) return '-';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};
const formatAmount = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: value >= 1000 ? 0 : 4 });
const formatPercent = (value = 0) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const chainAccent = (chain: string) => CHAIN_COLORS[chain] || CHAIN_COLORS.base;
const FALLBACK_LOGOS: Record<string, string> = {
  PLS: 'https://tokens.app.pulsex.com/images/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27.png',
  WPLS: 'https://tokens.app.pulsex.com/images/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27.png',
  PLSX: 'https://tokens.app.pulsex.com/images/tokens/0x95B303987A60C71504D99Aa1b13B4DA07b0790ab.png',
  INC: 'https://tokens.app.pulsex.com/images/tokens/0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d.png',
  HEX: 'https://tokens.app.pulsex.com/images/tokens/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39.png',
  EHEX: 'https://cdn.dexscreener.com/cms/images/a46bd12940d8501c2aacdd10ad4780e818bdedaba1ec8eb46b52e4d8313d4a93?width=64&height=64&fit=crop&quality=95&format=auto',
  PRVX: 'https://cdn.dexscreener.com/cms/images/ODHYYN7yppDHnd6u?width=64&height=64&fit=crop&quality=95&format=auto',
  MOST: 'https://tokens.app.pulsex.com/images/tokens/0xE33A5AE21F93aceC5CfC0b7b0FDBB65A0f0Be5cC.png',
  PDAI: 'https://tokens.app.pulsex.com/images/tokens/0x6B175474E89094C44Da98b954EedeAC495271d0F.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
};

function CoinListLogo({ logoUrl, symbol }: { logoUrl?: string; symbol: string }) {
  const [broken, setBroken] = React.useState(false);
  const resolvedLogo = logoUrl || FALLBACK_LOGOS[symbol.toUpperCase()];

  return (
    <span className="coin-list-logo">
      {resolvedLogo && !broken ? (
        <img src={resolvedLogo} alt={symbol} onError={() => setBroken(true)} />
      ) : (
        symbol.slice(0, 1)
      )}
    </span>
  );
}

function formatChainLabel(chain: string) {
  return chain.charAt(0).toUpperCase() + chain.slice(1);
}

/**
 * CoinList component for displaying a table of cryptocurrency assets.
 *
 * Shows price, balance, value, and performance metrics for a list of coins.
 * Supports two variants: compact (expandable rows) or detailed (all info visible).
 * Includes actions like copying addresses, opening explorers, and managing portfolio items.
 *
 * @example
 * ```tsx
 * <CoinList
 *   items={coins}
 *   variant="detailed"
 *   onRowClick={(coin) => openCoinDetail(coin)}
 *   onAdd={(coin) => addToWatchlist(coin)}
 *   onRemove={(coin) => removeFromWatchlist(coin)}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.items - Array of coin items to display
 * @param props.variant - Display mode: 'compact' or 'detailed' (default: 'detailed')
 * @param props.emptyMessage - Message when list is empty (default: 'No assets found.')
 * @param props.expandedId - ID of expanded row in compact mode
 * @param props.onToggleExpanded - Callback when expand/collapse is clicked
 * @param props.onRowClick - Callback when a row is clicked
 * @param props.renderExpanded - Render function for expanded row content
 * @param props.onCopyContract - Callback to copy contract address
 * @param props.onOpenExternal - Callback to open external links
 * @param props.onCalculator - Callback to open calculator
 * @param props.onAdd - Callback to add coin to portfolio
 * @param props.onRemove - Callback to remove coin from list
 * @returns The coin list component
 */
export function CoinList({
  items,
  variant = 'detailed',
  emptyMessage = 'No assets found.',
  expandedId = null,
  onToggleExpanded,
  onRowClick,
  renderExpanded,
  onCopyContract,
  onOpenExternal,
  onCalculator,
  onAdd,
  onRemove,
}: CoinListProps) {
  const [sortField, setSortField] = React.useState<SortField>('valueUsd');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  const sorted = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[sortField] ?? 0;
      const bValue = b[sortField] ?? 0;
      return sortDir === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
    });
  }, [items, sortDir, sortField]);

  const toggleSort = (field: SortField) => {
    setSortField(current => {
      if (current === field) {
        setSortDir(dir => dir === 'desc' ? 'asc' : 'desc');
        return current;
      }
      setSortDir('desc');
      return field;
    });
  };

  if (sorted.length === 0) {
    return <div className="coin-list-empty">{emptyMessage}</div>;
  }

  return (
    <div className={`coin-list coin-list--${variant}`}>
      {variant === 'detailed' ? (
        <div className="coin-list-head">
          <button type="button" className="coin-list-head-cell coin-list-head-cell--asset">Token</button>
          <button type="button" className="coin-list-head-cell" onClick={() => toggleSort('priceUsd')}>Price</button>
          <button type="button" className="coin-list-head-cell" onClick={() => toggleSort('change24h')}>24H</button>
          <button type="button" className="coin-list-head-cell">Amount</button>
          <button type="button" className="coin-list-head-cell" onClick={() => toggleSort('valueUsd')}>USD Value</button>
          <span className="coin-list-head-cell coin-list-head-cell--actions" />
        </div>
      ) : null}
      <div className="coin-list-body">
        {sorted.map((item) => {
          const isExpanded = expandedId === item.id;
          const pnlTone = (item.pnlUsd ?? 0) >= 0 ? 'is-up' : 'is-down';
          const dayTone = (item.change24h ?? 0) >= 0 ? 'is-up' : 'is-down';
          const canExpand = Boolean(renderExpanded && onToggleExpanded);
          return (
            <div key={item.id} className={`coin-list-row${isExpanded ? ' is-expanded' : ''}`}>
              <button
                className="coin-list-row-main"
                type="button"
                aria-expanded={canExpand ? isExpanded : undefined}
                aria-label={`${item.name} (${item.symbol}) - ${formatUsd(item.valueUsd)} ${canExpand ? (isExpanded ? 'collapse' : 'expand') : ''}`}
                onClick={() => canExpand ? onToggleExpanded(item.id) : onRowClick?.(item)}
                >
                  <div className="coin-list-cell coin-list-cell--asset">
                    <CoinListLogo logoUrl={item.logoUrl} symbol={item.symbol} />
                    <div className="coin-list-copy">
                    <button type="button" className="coin-list-name" onClick={(event) => { event.stopPropagation(); onRowClick?.(item); }}>
                      {item.name}
                    </button>
                    <div className="coin-list-subline">
                      <span className="coin-list-chain-dot" style={{ background: chainAccent(item.chain) }} />
                      <span>{item.symbol.toLowerCase()} · {formatChainLabel(item.chain)}</span>
                      {item.meta ? <span className="coin-list-meta">{item.meta}</span> : null}
                      {item.tags?.map((tag) => <span className="coin-list-tag" key={`${item.id}-${tag}`}>{tag}</span>)}
                    </div>
                    {variant === 'detailed' ? (
                      <div className="coin-list-detailline">
                        {item.pricePls != null ? <span>{item.symbol}: {item.pricePls.toFixed(item.pricePls >= 1 ? 2 : 4)} PLS</span> : null}
                        {item.liquidityUsd != null ? <span>Liq {formatCompactUsd(item.liquidityUsd)}</span> : null}
                        {item.volume24hUsd != null ? <span>Vol {formatCompactUsd(item.volume24hUsd)}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="coin-list-cell">
                  <strong className="coin-list-value">{formatPrice(item.priceUsd)}</strong>
                  {variant === 'detailed' && item.pricePls != null ? (
                    <small className="coin-list-subvalue coin-list-subvalue--accent">{item.pricePls.toFixed(item.pricePls >= 1 ? 2 : 4)} PLS</small>
                  ) : null}
                </div>

                {variant === 'detailed' ? (
                  <>
                    <div className={`coin-list-cell ${dayTone}`}>
                      <strong className="coin-list-value">{formatPercent(item.change24h)}</strong>
                    </div>
                    <div className="coin-list-cell">
                      <strong className="coin-list-value">{formatAmount(item.balance)}</strong>
                      <small className="coin-list-subvalue">{item.symbol}</small>
                    </div>
                    <div className="coin-list-cell">
                      <strong className="coin-list-value">{formatUsd(item.valueUsd)}</strong>
                      {item.valuePls != null ? <small className="coin-list-subvalue coin-list-subvalue--accent">{formatAmount(item.valuePls)} PLS</small> : null}
                    </div>
                    <div className="coin-list-cell coin-list-cell--actions">
                      {item.contractAddress ? (
                        <button type="button" className="coin-list-icon" title="Copy contract" aria-label={`Copy ${item.symbol} contract`} onClick={(event) => {
                          event.stopPropagation();
                          if (onCopyContract) onCopyContract(item);
                          else navigator.clipboard.writeText(item.contractAddress!);
                        }}>
                          <Copy size={12} />
                        </button>
                      ) : null}
                      <button type="button" className="coin-list-icon" title="Open detail" aria-label={`Open ${item.symbol} detail`} onClick={(event) => { event.stopPropagation(); onOpenExternal ? onOpenExternal(item) : onRowClick?.(item); }}>
                        <ExternalLink size={12} />
                      </button>
                      {onCalculator ? (
                        <button type="button" className="coin-list-icon" title="Calculator" aria-label={`Open ${item.symbol} calculator`} onClick={(event) => { event.stopPropagation(); onCalculator(item); }}>
                          <Calculator size={12} />
                        </button>
                      ) : null}
                      {onAdd ? (
                        <button type="button" className="coin-list-icon" title="Add" aria-label={`Add ${item.symbol}`} onClick={(event) => { event.stopPropagation(); onAdd(item); }}>
                          <PlusCircle size={12} />
                        </button>
                      ) : null}
                      {onRemove ? (
                        <button type="button" className="coin-list-icon" title="Remove" aria-label={`Remove ${item.symbol}`} onClick={(event) => { event.stopPropagation(); onRemove(item); }}>
                          <MinusCircle size={12} />
                        </button>
                      ) : null}
                      {item.pnlUsd != null ? (
                        <span className={`coin-list-pnl-chip ${pnlTone}`}>
                          {item.pnlUsd >= 0 ? '+' : '-'}{formatCompactUsd(Math.abs(item.pnlUsd))}
                        </span>
                      ) : null}
                      {canExpand ? <span className="coin-list-caret">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span> : null}
                    </div>
                  </>
                ) : (
                  <div className="coin-list-cell coin-list-cell--compact-right">
                    <strong className="coin-list-value">{formatUsd(item.valueUsd)}</strong>
                    <small className="coin-list-subvalue">{formatAmount(item.balance)} · <span className={dayTone}>{formatPercent(item.change24h)}</span></small>
                  </div>
                )}
              </button>
              {isExpanded && renderExpanded ? <div className="coin-list-expanded">{renderExpanded(item)}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
