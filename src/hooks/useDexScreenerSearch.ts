import { useState, useCallback } from 'react';
import { fetchDexScreenerByAddress, fetchDexScreenerByShareId, parseWatchlistUrl } from '../utils/dexScreener';

interface SearchResult {
  chainId: string;
  pairAddress: string;
  dexScreenerUrl: string;
}

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
