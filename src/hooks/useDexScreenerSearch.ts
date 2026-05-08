import { useState, useCallback } from 'react';
import { fetchDexScreenerByAddress, fetchDexScreenerByShareId, parseWatchlistUrl } from '../utils/dexScreener';

/**
 * Search result from DexScreener.
 */
interface SearchResult {
  /** Blockchain network ID */
  chainId: string;

  /** Liquidity pair contract address */
  pairAddress: string;

  /** DexScreener URL for this pair */
  dexScreenerUrl: string;
}

/**
 * Hook for searching token pairs on DexScreener by address or watchlist.
 *
 * Provides methods to search for trading pairs by contract address, watchlist share ID,
 * or watchlist URL. Handles loading and error states automatically.
 *
 * @example
 * ```tsx
 * const { results, loading, error, searchByAddress } = useDexScreenerSearch();
 *
 * const handleSearch = async () => {
 *   await searchByAddress('pulsechain', '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39');
 * };
 * ```
 *
 * @returns Object with search methods and state
 * @returns {SearchResult[]} returns.results - Search results
 * @returns {boolean} returns.loading - Whether search is in progress
 * @returns {string | null} returns.error - Error message if search failed
 * @returns {function} returns.searchByAddress - Search by chain and contract address
 * @returns {function} returns.searchByShareId - Search by watchlist share ID
 * @returns {function} returns.searchByUrl - Search by watchlist URL
 */
export function useDexScreenerSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByAddress = useCallback(async (chain: string, address: string) => {
    setLoading(true);
    setError(null);
    try {
      const pairs = await fetchDexScreenerByAddress(chain, address);
      const mapped = pairs.map((p) => ({
        chainId: p.chainId,
        pairAddress: p.pairAddress,
        dexScreenerUrl: `https://dexscreener.com/${p.chainId}/${p.pairAddress}`,
      }));
      setResults(mapped);
    } catch (e) {
      setError(`Failed to search: ${(e as Error).message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByShareId = useCallback(async (shareId: string) => {
    setLoading(true);
    setError(null);
    try {
      const pairs = await fetchDexScreenerByShareId(shareId);
      const mapped = pairs.map((p) => ({
        chainId: p.chainId,
        pairAddress: p.pairAddress,
        dexScreenerUrl: `https://dexscreener.com/${p.chainId}/${p.pairAddress}`,
      }));
      setResults(mapped);
    } catch (e) {
      console.error('Share link fetch failed:', e);
      setError('Share link not found or unavailable');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByUrl = useCallback(async (url: string) => {
    const parsed = parseWatchlistUrl(url);
    if (!parsed) {
      setError('Invalid watchlist URL');
      return;
    }

    if (parsed.type === 'shareId') {
      await searchByShareId(parsed.shareId);
    } else {
      setResults(
        parsed.entries.map((e) => ({
          chainId: e.chainId,
          pairAddress: e.pairAddress,
          dexScreenerUrl: `https://dexscreener.com/${e.chainId}/${e.pairAddress}`,
        }))
      );
    }
  }, [searchByShareId]);

  return { results, loading, error, searchByAddress, searchByShareId, searchByUrl };
}
