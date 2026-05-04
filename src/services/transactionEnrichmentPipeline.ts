import { Transaction } from '../types';
import { getHistoricPrice } from './coingeckoHistoricPriceService';

/**
 * Mapping of token contract addresses to CoinGecko token IDs.
 * Supports PulseChain and Ethereum tokens.
 * Addresses should be lowercase for consistent matching.
 */
const TOKEN_COINGECKO_MAP: Record<string, string> = {
  // PulseChain tokens
  '0x2b59bde899d57025b4b8e3b8f5bdaf8a8a27c7cc': 'hex-money', // HEX
  '0x95b6e99cffc8bffc7baf4c4a69ebeb9cc8b9fee1f': 'pulsex', // PulseX
  '0xa1077a294dde1b09ad48b41f3b0dd891be3ca3fb': 'wrapped-pulse', // WPLS
  '0xefccb3b2a734cd3ceca6f11a5e5c3a5e6dea4f07': 'usd-coin', // USDC (PulseChain)
  '0x15d38e3fc1ef2ac1bbd435217bb02221b41baebc': 'dai', // DAI (PulseChain)
  '0x0cb6f5a34ad42ec934882a05265e85d7881c19e3': 'tether', // USDT (PulseChain)

  // Ethereum tokens (for cross-chain transactions)
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum', // WETH
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'bitcoin', // WBTC
};

/**
 * Resolves a token contract address to its CoinGecko token ID.
 * Case-insensitive address matching.
 *
 * @param address - Token contract address
 * @returns CoinGecko token ID or null if not found
 */
export function getTokenCoinGeckoId(address: string): string | null {
  if (!address) return null;

  const lowerAddress = address.toLowerCase();
  const id = TOKEN_COINGECKO_MAP[lowerAddress];

  return id || null;
}

/**
 * Enriches transactions with historic prices from CoinGecko.
 * Populates assetPriceUsdAtTx, counterPriceUsdAtTx, and native price fields.
 * Never throws; returns transactions with available price data.
 *
 * Graceful degradation:
 * - Missing historic prices: returns transaction with null prices
 * - Future transactions: returns with null prices (no future data available)
 * - Zero amounts: skipped, returned as-is
 * - API errors: logged and transaction returned with available data
 *
 * @param transactions - Array of raw transactions to enrich
 * @returns Promise of enriched transactions
 */
export async function enrichTransactionsWithHistoricPrices(
  transactions: Transaction[]
): Promise<Transaction[]> {
  if (!transactions.length) return [];

  const enriched: Transaction[] = [];

  for (const tx of transactions) {
    try {
      const enrichedTx = await enrichSingleTransaction(tx);
      enriched.push(enrichedTx);
    } catch (error) {
      // Never throw; log and return transaction as-is
      console.warn(
        `Failed to enrich transaction ${tx.id}, returning partial enrichment:`,
        error
      );
      enriched.push(tx);
    }
  }

  return enriched;
}

/**
 * Enriches a single transaction with historic prices.
 * Handles swaps with USD and native prices, deposits/withdrawals with USD prices.
 * Defensive against edge cases: null prices, zero amounts, future dates, precision loss.
 */
async function enrichSingleTransaction(tx: Transaction): Promise<Transaction> {
  // Edge case 1: Skip if no transaction date provided
  if (!tx.txDate) {
    return tx;
  }

  // Edge case 2: Skip if amount is zero (dust/pending)
  if (typeof tx.amount === 'number' && tx.amount === 0) {
    return tx;
  }

  const enrichedTx = { ...tx };

  // Handle swap transactions (require both asset and counter-asset)
  if (tx.type === 'swap') {
    // Defensive: validate token addresses exist
    if (!tx.assetTokenAddress || !tx.counterTokenAddress) {
      return enrichedTx;
    }

    const assetTokenId = getTokenCoinGeckoId(tx.assetTokenAddress);
    const counterTokenId = getTokenCoinGeckoId(tx.counterTokenAddress);

    if (!assetTokenId || !counterTokenId) {
      console.warn(
        `[Enrichment] Unable to map token IDs for swap ${tx.id}. Asset: ${tx.assetTokenAddress}, Counter: ${tx.counterTokenAddress}`
      );
      return enrichedTx;
    }

    // Fetch historic USD prices
    const assetPrice = await getHistoricPrice(assetTokenId, tx.txDate);
    const counterPrice = await getHistoricPrice(counterTokenId, tx.txDate);

    // Log when prices are missing (graceful degradation)
    if (assetPrice === null) {
      console.warn(
        `[Enrichment] Historic price unavailable for asset ${tx.asset} (${assetTokenId}) on ${tx.txDate.toISOString().split('T')[0]}. Will use fallback value.`
      );
    }
    if (counterPrice === null) {
      console.warn(
        `[Enrichment] Historic price unavailable for counter-asset ${tx.counterAsset} (${counterTokenId}) on ${tx.txDate.toISOString().split('T')[0]}. Will use fallback value.`
      );
    }

    enrichedTx.assetPriceUsdAtTx = assetPrice;
    enrichedTx.counterPriceUsdAtTx = counterPrice;

    // For PulseChain, calculate native prices
    if (tx.chain === 'pulsechain') {
      const plsPrice = await getHistoricPrice('pulse', tx.txDate);

      // Edge case 3: Defend against division by zero
      if (
        assetPrice !== null &&
        plsPrice !== null &&
        plsPrice > 0 &&
        counterPrice !== null
      ) {
        enrichedTx.assetPriceNativeAtTx = assetPrice / plsPrice;
        enrichedTx.counterPriceNativeAtTx = counterPrice / plsPrice;
      } else {
        enrichedTx.assetPriceNativeAtTx = null;
        enrichedTx.counterPriceNativeAtTx = null;
      }
    }

    return enrichedTx;
  }

  // Handle deposit/withdraw transactions (single asset)
  if (tx.assetTokenAddress) {
    const assetTokenId = getTokenCoinGeckoId(tx.assetTokenAddress);

    if (!assetTokenId) {
      console.warn(
        `[Enrichment] Unable to map token ID for ${tx.type} ${tx.id}. Token: ${tx.assetTokenAddress}`
      );
      return enrichedTx;
    }

    const assetPrice = await getHistoricPrice(assetTokenId, tx.txDate);

    // Log when price is missing
    if (assetPrice === null) {
      console.warn(
        `[Enrichment] Historic price unavailable for ${tx.asset} (${assetTokenId}) on ${tx.txDate.toISOString().split('T')[0]}. Cost basis will use fallback.`
      );
    }

    enrichedTx.assetPriceUsdAtTx = assetPrice;

    // For PulseChain, calculate native price
    if (tx.chain === 'pulsechain' && assetPrice !== null) {
      const plsPrice = await getHistoricPrice('pulse', tx.txDate);

      // Edge case 3: Defend against division by zero
      if (plsPrice !== null && plsPrice > 0) {
        enrichedTx.assetPriceNativeAtTx = assetPrice / plsPrice;
      } else {
        enrichedTx.assetPriceNativeAtTx = null;
      }
    }
  }

  return enrichedTx;
}
