interface DexScreenerPair {
  chainId?: string;
  pairAddress?: string;
  address?: string;
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

export async function fetchDexScreenerByAddress(
  chain: string,
  contractAddress: string
): Promise<{ chainId: string; pairAddress: string }[]> {
  const ENDPOINTS = [
    `https://api.dexscreener.com/latest/dex/tokens/${chain === 'pulsechain' ? 'pulsechain' : chain}:${contractAddress}`,
    `https://api.dexscreener.com/search?q=${contractAddress}`,
  ];

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data: DexScreenerResponse = await res.json();

      const pairs = (data.pairs || []).map((p: DexScreenerPair) => ({
        chainId: p.chainId || chain,
        pairAddress: p.pairAddress || p.address,
      }));

      if (pairs.length > 0) return pairs;
    } catch {
      /* try next endpoint */
    }
  }

  return [];
}

export async function fetchDexScreenerByShareId(shareId: string): Promise<{ chainId: string; pairAddress: string }[]> {
  const ENDPOINTS = [
    `https://api.dexscreener.com/watchlist/v1/share/${shareId}`,
    `https://api.dexscreener.com/watchlist/v2/share/${shareId}`,
    `https://io.dexscreener.com/dex/watchlist/v1/share/${shareId}`,
  ];

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data = await res.json();

      const rawItems: DexScreenerPair[] =
        (Array.isArray(data) ? data : null) ??
        (Array.isArray(data.pairs) ? data.pairs : null) ??
        (Array.isArray(data.items) ? data.items : null) ??
        [];

      const entries: { chainId: string; pairAddress: string }[] = [];

      for (const item of rawItems) {
        if (typeof item === 'string') {
          const under = item.indexOf('_');
          if (under > 0) {
            entries.push({ chainId: item.slice(0, under).toLowerCase(), pairAddress: item.slice(under + 1).toLowerCase() });
          }
        } else if (typeof item === 'object' && item !== null) {
          const chain = (item.chainId ?? 'pulsechain').toString().toLowerCase();
          const addr = (item.pairAddress ?? item.address ?? '').toString().toLowerCase();
          if (addr.length > 10) {
            entries.push({ chainId: chain, pairAddress: addr });
          }
        }
      }

      if (entries.length > 0) return entries;
    } catch {
      /* try next endpoint */
    }
  }

  throw new Error('DS_SHARE_UNAVAILABLE');
}

export function parseWatchlistUrl(raw: string): { type: 'pairs'; entries: { chainId: string; pairAddress: string }[] } | { type: 'shareId'; shareId: string } | null {
  try {
    const url = new URL(raw.trim());

    const pathMatch = url.pathname.match(/^\/watchlist\/([A-Za-z0-9_-]{4,100})$/);
    if (pathMatch) {
      return { type: 'shareId', shareId: pathMatch[1] };
    }

    let wl = url.searchParams.get('watchlist');
    if (!wl && url.hash) {
      try {
        const qMark = url.hash.indexOf('?');
        if (qMark !== -1) {
          const hashSearch = new URLSearchParams(url.hash.slice(qMark + 1));
          wl = hashSearch.get('watchlist');
        }
      } catch {
        /* ignore */
      }
    }

    if (wl) {
      const entries = wl.split(',').flatMap((s) => {
        const trimmed = s.trim();
        const under = trimmed.indexOf('_');
        if (under < 1) return [];
        const chainId = trimmed.slice(0, under).toLowerCase();
        const pairAddress = trimmed.slice(under + 1).toLowerCase();
        if (!chainId || !pairAddress) return [];
        return [{ chainId, pairAddress }];
      });
      if (entries.length > 0) return { type: 'pairs', entries };
    }

    return null;
  } catch {
    return null;
  }
}
