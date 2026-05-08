import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export formatting utilities from centralized formatting module
// to maintain backward compatibility with existing imports
export { fmtUsd, fmtTok } from '../utils/formatting';

// --- RPC Fallback Utility ----------------------------------------------------

/**
 * Executes `fetchFn` against the primary RPC URL first.
 * If the primary throws (network error, timeout, non-2xx), retries sequentially
 * through each entry in `fallbackRpcs` until one succeeds or all are exhausted.
 *
 * @param primaryRpc   - Primary RPC endpoint URL.
 * @param fallbackRpcs - Ordered list of fallback RPC endpoint URLs.
 * @param fetchFn      - Async function that receives an RPC URL and returns T.
 * @returns The result from the first RPC that succeeds.
 * @throws  The last error if every RPC fails.
 */
export async function fetchWithRpcFallback<T>(
  primaryRpc: string,
  fallbackRpcs: string[],
  fetchFn: (rpcUrl: string) => Promise<T>,
): Promise<T> {
  const rpcs = [primaryRpc, ...fallbackRpcs];
  let lastError: unknown;
  for (const rpc of rpcs) {
    try {
      return await fetchFn(rpc);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
