import type { Asset, Chain, InvestmentHoldingRow, InvestmentSourceAttribution, Transaction } from '../types';

interface PositionState {
  amount: number;
  totalCost: number;
  sourceMix: Map<string, InvestmentSourceAttribution>;
  routes: string[];
}

const BRIDGE_LABEL_RE = /\(from\s+(Ethereum|Base)\)/i;
const STABLE_FAMILIES = new Set(['USDC', 'USDT', 'DAI']);

const chainLabel = (chain: Chain) => chain.charAt(0).toUpperCase() + chain.slice(1);

function sanitizeSymbol(asset: string): string {
  return asset
    .replace(BRIDGE_LABEL_RE, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, '');
}

function sourceFamily(asset: string): string {
  const upper = asset.toUpperCase();
  if (upper.includes('USDC')) return 'USDC';
  if (upper.includes('USDT')) return 'USDT';
  if (upper.includes('DAI')) return 'DAI';
  if (upper.includes('WETH') || upper === 'ETH') return 'ETH';
  if (upper === 'EHEX' || upper.includes('EHEX')) return 'eHEX';
  return sanitizeSymbol(asset).toUpperCase() || asset.toUpperCase();
}

function parseOriginChain(asset: string): Chain | null {
  const match = asset.match(BRIDGE_LABEL_RE);
  if (!match) return null;
  return match[1].toLowerCase() as Chain;
}

function normalizeTxSymbol(asset: string, chain: Chain): string {
  const upper = asset.toUpperCase();
  if (upper === 'EHEX' || upper.includes('EHEX')) return 'eHEX';
  if (upper.startsWith('PDAI')) return 'pDAI';
  if (upper.startsWith('PUSDC')) return 'pUSDC';
  if (upper.startsWith('PUSDT')) return 'pUSDT';

  const family = sourceFamily(asset);
  const originChain = parseOriginChain(asset);

  if (chain === 'pulsechain' && originChain) {
    if (family === 'ETH') return 'WETH';
    if (family === 'eHEX' || family === 'HEX') return 'eHEX';
    if (STABLE_FAMILIES.has(family)) return `p${family}`;
  }

  if (
    chain === 'pulsechain'
    && STABLE_FAMILIES.has(family)
    && (upper.includes('FORK COPY') || upper.includes('SYSTEM COPY'))
  ) {
    return `p${family}`;
  }

  if (family === 'ETH' && upper.includes('WETH')) return 'WETH';
  return family === 'eHEX' ? 'eHEX' : sanitizeSymbol(asset) || family;
}

function normalizeHoldingSymbol(asset: Pick<Asset, 'symbol' | 'name' | 'chain'>): string {
  const symbol = (asset.symbol || '').toUpperCase();
  const name = (asset.name || '').toUpperCase();

  if (asset.chain === 'pulsechain' && symbol === 'WPLS') return 'PLS';
  if (symbol === 'EHEX' || ((symbol === 'HEX' || symbol === 'EHEX') && name.includes('FROM ETHEREUM'))) return 'eHEX';
  if (symbol === 'PDAI') return 'pDAI';
  if (symbol === 'PUSDC') return 'pUSDC';
  if (symbol === 'PUSDT') return 'pUSDT';

  if (
    asset.chain === 'pulsechain'
    && ['DAI', 'USDC', 'USDT'].includes(symbol)
    && (name.includes('FORK COPY') || name.includes('SYSTEM COPY'))
  ) {
    return `p${symbol}`;
  }

  return asset.symbol;
}

function assetKey(chain: Chain, symbol: string): string {
  return `${chain}:${symbol}`;
}

function ensurePosition(store: Map<string, PositionState>, key: string): PositionState {
  let position = store.get(key);
  if (!position) {
    position = { amount: 0, totalCost: 0, sourceMix: new Map(), routes: [] };
    store.set(key, position);
  }
  return position;
}

function cloneSources(sources: InvestmentSourceAttribution[]): Map<string, InvestmentSourceAttribution> {
  const map = new Map<string, InvestmentSourceAttribution>();
  sources.forEach((source) => {
    map.set(`${source.asset}:${source.chain}`, { ...source });
  });
  return map;
}

function addSourceMix(target: Map<string, InvestmentSourceAttribution>, sources: Map<string, InvestmentSourceAttribution>) {
  sources.forEach((source, key) => {
    const existing = target.get(key);
    if (existing) existing.amountUsd += source.amountUsd;
    else target.set(key, { ...source });
  });
}

function seedSources(asset: string, chain: Chain, usd: number): Map<string, InvestmentSourceAttribution> {
  const family = sourceFamily(asset);
  const sourceChain = parseOriginChain(asset) ?? chain;
  return cloneSources([{ asset: family, chain: sourceChain, amountUsd: usd }]);
}

/**
 * Calculate the USD value of a transaction for fallback/estimation purposes.
 * Defensive: validates all inputs before calculations.
 */
function txUsdValue(tx: Transaction, ethUsdPrice: number): number {
  // Edge case: explicit valueUsd takes precedence if > 0
  if ((tx.valueUsd ?? 0) > 0) return tx.valueUsd ?? 0;

  // Edge case: validate amount
  const amount = tx.amount ?? 0;
  if (amount === 0 || !isFinite(amount)) return 0;

  // Edge case: validate ethUsdPrice
  if (!isFinite(ethUsdPrice) || ethUsdPrice <= 0) ethUsdPrice = 0;

  const family = sourceFamily(tx.asset);
  if (family === 'ETH' && ethUsdPrice > 0) return amount * ethUsdPrice;
  if (STABLE_FAMILIES.has(family)) return amount; // Stablecoins ~= 1:1
  return 0;
}

/**
 * Calculate cost basis using historic price at transaction time.
 * For acquisitions, uses amount * assetPriceUsdAtTx (or falls back to valueUsd).
 * Returns the USD cost of acquiring the amount.
 *
 * Graceful degradation and edge case handling:
 * - null/undefined prices: falls back to valueUsd
 * - zero amounts: returns 0 (no cost)
 * - negative prices (shouldn't happen): treated as null
 * - Precision: preserves decimal values without rounding
 */
function getCostBasisFromTx(tx: Transaction, ethUsdPrice: number): number {
  // Edge case: zero or undefined amount
  const amount = tx.amount ?? 0;
  if (amount === 0 || !isFinite(amount)) return 0;

  // Prefer historic price if available and valid
  if (tx.assetPriceUsdAtTx != null && isFinite(tx.assetPriceUsdAtTx) && tx.assetPriceUsdAtTx > 0) {
    const costBasis = amount * tx.assetPriceUsdAtTx;
    if (isFinite(costBasis)) {
      return costBasis;
    }
  }

  // Fall back to valueUsd if available and valid
  const valueUsd = tx.valueUsd ?? 0;
  if (valueUsd > 0 && isFinite(valueUsd)) {
    return valueUsd;
  }

  // Last resort: estimate based on asset type
  const family = sourceFamily(tx.asset);
  if (family === 'ETH' && isFinite(ethUsdPrice) && ethUsdPrice > 0) {
    const cost = amount * ethUsdPrice;
    if (isFinite(cost)) return cost;
  }
  if (STABLE_FAMILIES.has(family)) return amount; // Stablecoins: 1:1

  return 0;
}

function pushRoute(position: PositionState, route: string) {
  if (!route) return;
  if (position.routes[position.routes.length - 1] === route) return;
  position.routes.push(route);
  if (position.routes.length > 4) position.routes.shift();
}

/**
 * Remove amount from a position, returning the pro-rata cost and sources.
 * Defensive: validates all numeric values, prevents negative amounts.
 */
function removeFromPosition(
  store: Map<string, PositionState>,
  key: string,
  amount: number,
  fallbackUsd = 0,
): { cost: number; sources: Map<string, InvestmentSourceAttribution> } {
  const position = store.get(key);

  // Edge case: validate amount is positive and finite
  const validAmount = amount ?? 0;
  if (!isFinite(validAmount) || validAmount <= 0) {
    return { cost: fallbackUsd, sources: new Map() };
  }

  if (!position || position.amount <= 0) {
    return { cost: fallbackUsd, sources: new Map() };
  }

  // Calculate pro-rata removal, cap at 100%
  const ratio = Math.min(1, validAmount / position.amount);
  const removedCost = position.totalCost * ratio;
  const removedSources = new Map<string, InvestmentSourceAttribution>();

  position.sourceMix.forEach((source, sourceKey) => {
    const amountUsd = source.amountUsd * ratio;
    removedSources.set(sourceKey, { ...source, amountUsd });
    source.amountUsd -= amountUsd;
    // Remove source if its value is negligible
    if (source.amountUsd <= 0.0001) position.sourceMix.delete(sourceKey);
  });

  position.amount -= position.amount * ratio;
  position.totalCost -= removedCost;

  // Edge case: clean up position if empty
  if (position.amount <= 0.0000001) {
    position.amount = 0;
    position.totalCost = 0;
    position.sourceMix.clear();
  }

  // Return valid cost or fallback
  const finalCost = isFinite(removedCost) ? removedCost : fallbackUsd;
  return { cost: finalCost || fallbackUsd, sources: removedSources };
}

/**
 * Add amount to a position with cost and sources.
 * Defensive: validates amounts before adding, prevents negative values.
 */
function addToPosition(
  store: Map<string, PositionState>,
  key: string,
  amount: number,
  cost: number,
  sources: Map<string, InvestmentSourceAttribution>,
  route?: string,
) {
  // Edge case: validate amount and cost are finite and non-negative
  const validAmount = amount ?? 0;
  const validCost = cost ?? 0;

  if (!isFinite(validAmount) || validAmount <= 0) return;
  if (!isFinite(validCost) || validCost < 0) return;

  const position = ensurePosition(store, key);
  position.amount += validAmount;
  position.totalCost += validCost;
  addSourceMix(position.sourceMix, sources);
  if (route) pushRoute(position, route);
}

function buildRouteSummary(position?: PositionState): string {
  if (!position || position.routes.length === 0) return 'Tracked from imported transaction history';
  return position.routes.slice(-2).join(' • ');
}

/**
 * Build investment holding rows from current assets and transaction history.
 * Calculates cost basis, P&L, and source attribution.
 *
 * Edge case handling:
 * - Zero/negative amounts: skipped
 * - Missing prices: falls back to valueUsd
 * - Invalid values: filtered out or treated as 0
 * - Large numbers: handled without precision loss (JavaScript numbers)
 * - Precision: preserves decimals through calculations
 */
export function buildInvestmentRows(
  currentAssets: Asset[],
  currentTransactions: Transaction[],
  ethUsdPrice: number,
): InvestmentHoldingRow[] {
  // Edge case: validate ethUsdPrice
  const validEthPrice = isFinite(ethUsdPrice) && ethUsdPrice > 0 ? ethUsdPrice : 0;

  const positions = new Map<string, PositionState>();
  const txs = [...(currentTransactions ?? [])].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  txs.forEach((tx) => {
    // Edge case: skip transactions with missing required fields
    if (!tx.asset || typeof tx.amount !== 'number' || tx.amount === 0) {
      return;
    }

    const receiveSymbol = normalizeTxSymbol(tx.asset, tx.chain);
    const receiveKey = assetKey(tx.chain, receiveSymbol);
    const usdValue = txUsdValue(tx, validEthPrice);
    const costBasis = getCostBasisFromTx(tx, validEthPrice);

    if (tx.type === 'deposit') {
      const originChain = parseOriginChain(tx.asset);
      const family = sourceFamily(tx.asset);
      const originSymbol = originChain ? normalizeTxSymbol(family, originChain) : receiveSymbol;
      const originKey = originChain ? assetKey(originChain, originSymbol) : null;

      if (originChain && originKey && (originChain === 'ethereum' || originChain === 'base')) {
        const transferred = removeFromPosition(positions, originKey, tx.amount, usdValue);
        const route = `${chainLabel(originChain)} bridge -> ${receiveSymbol}`;
        const sources = transferred.sources.size > 0 ? transferred.sources : seedSources(tx.asset, tx.chain, transferred.cost || costBasis);
        addToPosition(positions, receiveKey, tx.amount, transferred.cost || costBasis, sources, route);
        return;
      }

      if (tx.chain !== 'ethereum' && tx.chain !== 'base') {
        return;
      }

      addToPosition(positions, receiveKey, tx.amount, costBasis, seedSources(tx.asset, tx.chain, costBasis), `${sourceFamily(tx.asset)} deposit`);
      return;
    }

    if (tx.type === 'withdraw') {
      removeFromPosition(positions, receiveKey, tx.amount, usdValue);
      return;
    }

    if (tx.type === 'swap') {
      // Edge case: validate counter amount
      const counterAmount = tx.counterAmount ?? 0;
      if (counterAmount === 0) return;

      const soldSymbol = normalizeTxSymbol(tx.counterAsset || '', tx.chain);
      const soldKey = assetKey(tx.chain, soldSymbol);
      const removed = removeFromPosition(positions, soldKey, counterAmount, usdValue);
      const sources = removed.sources.size > 0 ? removed.sources : seedSources(tx.counterAsset || tx.asset, tx.chain, removed.cost || costBasis);
      addToPosition(positions, receiveKey, tx.amount, removed.cost || costBasis, sources, `${soldSymbol} -> ${receiveSymbol}`);
    }
  });

  return (currentAssets ?? [])
    .filter((asset) => asset.value > 0 && isFinite(asset.value))
    .sort((a, b) => b.value - a.value)
    .map((asset) => {
      const key = assetKey(asset.chain, normalizeHoldingSymbol(asset));
      const position = positions.get(key);
      const costBasis = position?.totalCost ?? 0;

      // Edge case: validate values before calculation
      const validValue = isFinite(asset.value) ? asset.value : 0;
      const validCost = isFinite(costBasis) ? costBasis : 0;
      const pnlUsd = validValue - validCost;
      const pnlPercent = validCost > 0 ? (pnlUsd / validCost) * 100 : 0;

      const sourceMix = [...(position?.sourceMix.values() ?? [])]
        .sort((a, b) => b.amountUsd - a.amountUsd)
        .slice(0, 4)
        .map((source) => ({ ...source }));

      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        chain: asset.chain,
        address: asset.address,
        logoUrl: asset.logoUrl,
        amount: asset.balance,
        currentPrice: asset.price,
        priceChange24h: asset.priceChange24h ?? asset.pnl24h ?? 0,
        currentValue: validValue,
        costBasis: validCost,
        pnlUsd,
        pnlPercent,
        sourceMix,
        routeSummary: buildRouteSummary(position),
        thenValue: validCost,
        nowValue: validValue,
      };
    });
}
