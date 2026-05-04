export interface PriceCache {
  [tokenId: string]: {
    [dateKey: string]: number | null;
  };
}

// Initialize cache from sessionStorage
let priceCache: PriceCache = {};
let cacheLoaded = false;

/**
 * Loads cache from sessionStorage
 */
function loadCache(): void {
  const cached = sessionStorage.getItem('priceCache');
  priceCache = cached ? JSON.parse(cached) : {};
  cacheLoaded = true;
}

/**
 * Loads cache on first module use
 */
function ensureCacheLoaded(): void {
  if (!cacheLoaded) {
    loadCache();
  }
}

/**
 * Persists cache to sessionStorage
 */
function saveCache(): void {
  sessionStorage.setItem('priceCache', JSON.stringify(priceCache));
}

/**
 * Converts Date to DD-MM-YYYY format for CoinGecko API
 */
function formatDateForApi(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Converts Date to YYYY-MM-DD format for cache keys
 */
function formatDateForCache(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Track last API call time for rate limiting
let lastApiCallTime = 0;
const RATE_LIMIT_DELAY_MS = 100;

/**
 * Implements rate limiting to avoid hitting API limits
 */
async function applyRateLimit(): Promise<void> {
  const timeSinceLastCall = Date.now() - lastApiCallTime;
  if (timeSinceLastCall < RATE_LIMIT_DELAY_MS) {
    const delayNeeded = RATE_LIMIT_DELAY_MS - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  lastApiCallTime = Date.now();
}

/**
 * Internal function to clear cache (for testing only)
 */
export function __clearCache(): void {
  priceCache = {};
  cacheLoaded = false;
  sessionStorage.removeItem('priceCache');
  lastApiCallTime = 0;
}

/**
 * Fetches historic price for a token on a specific date
 *
 * @param tokenId - CoinGecko token ID (e.g., 'ethereum', 'usd-coin')
 * @param date - Date to fetch price for
 * @returns Historic USD price or null if unavailable
 */
export async function getHistoricPrice(
  tokenId: string,
  date: Date
): Promise<number | null> {
  // Ensure cache is loaded from sessionStorage
  ensureCacheLoaded();

  const dateKey = formatDateForCache(date);

  // Check cache first
  if (priceCache[tokenId]?.[dateKey] !== undefined) {
    return priceCache[tokenId][dateKey];
  }

  try {
    // Apply rate limiting
    await applyRateLimit();

    const apiDate = formatDateForApi(date);
    const url =
      `https://api.coingecko.com/api/v3/coins/${tokenId}/history?` +
      `date=${apiDate}&localization=false`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `CoinGecko API error: ${response.status} for ${tokenId} on ${dateKey}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.market_data?.current_usd) {
      console.warn(`No market data available for ${tokenId} on ${dateKey}`);
      return null;
    }

    const price = data.market_data.current_usd;

    // Cache the result
    if (!priceCache[tokenId]) {
      priceCache[tokenId] = {};
    }
    priceCache[tokenId][dateKey] = price;
    saveCache();

    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${tokenId} on ${dateKey}:`, error);
    return null;
  }
}

/**
 * Batch fetches historic prices for multiple dates
 *
 * @param tokenId - CoinGecko token ID
 * @param dates - Array of dates to fetch prices for
 * @returns Map of ISO date string (YYYY-MM-DD) → USD price or null
 */
export async function getHistoricPrices(
  tokenId: string,
  dates: Date[]
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();

  for (const date of dates) {
    const price = await getHistoricPrice(tokenId, date);
    const dateKey = formatDateForCache(date);
    results.set(dateKey, price);
  }

  return results;
}
