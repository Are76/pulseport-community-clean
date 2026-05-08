/**
 * Pure helper functions extracted from App.tsx
 * These have no dependencies on components or context
 */

// -- Address formatting -------------------------------------------------------

/**
 * Shorten a wallet address for display (first 6 + last 4 chars).
 * @param addr - Full wallet address
 * @returns Shortened address like "0x1234...5678"
 * @example
 * shortenAddr('0x1234567890abcdef1234567890abcdef12345678') // "0x1234...5678"
 */
export function shortenAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// -- Symbol normalization (chain-aware) ----------------------------------------

/**
 * Normalize token symbol, accounting for chain-specific aliases.
 * On PulseChain, WPLS is normalized to PLS.
 * @param symbol - Token symbol to normalize
 * @param chain - Optional blockchain name for chain-aware normalization
 * @returns Uppercase normalized symbol
 */
export const normalizeAssetSymbol = (symbol: string, chain?: string): string => {
  const upper = (symbol || '').toUpperCase();
  return chain === 'pulsechain' && upper === 'WPLS' ? 'PLS' : upper;
};

/**
 * Compare two token symbols for equality, with chain-aware normalization.
 * @param left - First symbol to compare
 * @param right - Second symbol to compare
 * @param chain - Optional blockchain for normalization
 * @returns True if symbols match after normalization
 */
export const sameAssetSymbol = (left: string, right: string, chain?: string): boolean =>
  normalizeAssetSymbol(left, chain) === normalizeAssetSymbol(right, chain);

// -- localStorage cache helpers (BigInt-safe) ----------------------------------

/**
 * JSON replacer function that serializes BigInt values.
 * Use with JSON.stringify to handle BigInt values.
 * @example
 * JSON.stringify(data, bigIntReplacer)
 */
export const bigIntReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? `__bi__${value.toString()}` : value;

/**
 * JSON reviver function that deserializes BigInt values.
 * Use with JSON.parse to restore BigInt values.
 * @example
 * JSON.parse(str, bigIntReviver)
 */
export const bigIntReviver = (_key: string, value: unknown) =>
  typeof value === 'string' && value.startsWith('__bi__')
    ? BigInt(value.slice(6))
    : value;

/**
 * Read JSON from localStorage with error handling.
 * @param key - localStorage key
 * @param withBigInt - Whether to revive BigInt values (default: false)
 * @returns Parsed JSON or null if not found/invalid
 */
export function tryReadCache<T>(key: string, withBigInt = false): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return withBigInt ? JSON.parse(raw, bigIntReviver) : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Read JSON from localStorage with fallback value.
 * @param key - localStorage key
 * @param fallback - Default value if not found or invalid
 * @returns Parsed JSON or fallback value
 */
export function readStoredJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// -- Error detection ---------------------------------------------------------

export function isNoContractDataError(error: unknown): boolean {
  const err = error as { shortMessage?: string; message?: string; details?: string; name?: string; cause?: unknown };
  const cause = err?.cause as { shortMessage?: string; message?: string; details?: string; name?: string } | undefined;
  const text = [
    err?.name,
    err?.shortMessage,
    err?.message,
    err?.details,
    cause?.name,
    cause?.shortMessage,
    cause?.message,
    cause?.details,
  ].filter(Boolean).join(' ').toLowerCase();

  return text.includes('returned no data')
    || text.includes('contractfunctionzerodataerror')
    || text.includes('abidecodingzerodataerror')
    || text.includes('function may not exist');
}

// -- Liberty Swap decoding ---------------------------------------------------

export function decodeLibertySwapInput(input: string): { dstChainId: number; orderId: string } | null {
  const LIBERTY_SWAP_SELECTOR = 'dc655e26';
  try {
    const hex = input.startsWith('0x') ? input.slice(2) : input;
    if (!hex.startsWith(LIBERTY_SWAP_SELECTOR)) return null;
    if (hex.length < 8 + 13 * 64) return null;
    const word = (n: number) => hex.slice(8 + n * 64, 8 + (n + 1) * 64);
    const dstChainId = parseInt(word(12), 16);
    const orderId = '0x' + word(11);
    if (!dstChainId || isNaN(dstChainId)) return null;
    return { dstChainId, orderId };
  } catch {
    return null;
  }
}
