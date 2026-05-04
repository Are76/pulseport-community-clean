/**
 * Asset symbol normalization and comparison helpers.
 * Extracted from App.tsx for reuse across context and hooks.
 */

/** Normalize a raw token symbol for display/lookup consistency. */
export function normalizeAssetSymbol(symbol: string, chain?: string): string {
  const upper = (symbol || '').toUpperCase();
  return chain === 'pulsechain' && upper === 'WPLS' ? 'PLS' : upper;
}

/** True if two symbol strings refer to the same asset on the same chain. */
export function sameAssetSymbol(left: string, right: string, chain?: string): boolean {
  return normalizeAssetSymbol(left, chain) === normalizeAssetSymbol(right, chain);
}
