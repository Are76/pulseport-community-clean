import React, { ComponentType, Suspense, ReactElement } from 'react';

/**
 * Creates a lazy-loaded component with loading fallback
 * @param importFn - Dynamic import function
 * @param fallback - Optional fallback component (default: null)
 * @returns Suspended lazy component
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactElement | null = null
): ComponentType<P> {
  const LazyComponent = React.lazy(importFn);

  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <div className="p-8 text-gray-600">Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = 'LazyComponent';
  return WrappedComponent;
}

/**
 * Lazy-loaded pages
 */
export const LazyMyInvestmentsPage = createLazyComponent(() =>
  import('../pages/MyInvestmentsPage').then(m => ({ default: m.MyInvestmentsPage }))
);

export const LazyWalletAnalyzer = createLazyComponent(() =>
  import('../pages/WalletAnalyzer').then(m => ({ default: m.WalletAnalyzer }))
);

export const LazyWalletHoldingsPage = createLazyComponent(() =>
  import('../pages/WalletHoldingsPage').then(m => ({ default: m.WalletHoldingsPage }))
);

/**
 * Lazy-loaded tabs
 */
export const LazyHomeTab = createLazyComponent(() =>
  import('../tabs/HomeTab').then(m => ({ default: m.HomeTab }))
);

export const LazyAssetsTab = createLazyComponent(() =>
  import('../tabs/AssetsTab').then(m => ({ default: m.AssetsTab }))
);

export const LazyStakesTab = createLazyComponent(() =>
  import('../tabs/StakesTab').then(m => ({ default: m.StakesTab }))
);

export const LazyHistoryTab = createLazyComponent(() =>
  import('../tabs/HistoryTab').then(m => ({ default: m.HistoryTab }))
);

export const LazyOverviewTab = createLazyComponent(() =>
  import('../tabs/OverviewTab').then(m => ({ default: m.OverviewTab }))
);

export const LazyWalletsTab = createLazyComponent(() =>
  import('../tabs/WalletsTab').then(m => ({ default: m.WalletsTab }))
);
