import React from 'react';

/**
 * Props for the SkeletonLoader component.
 */
export interface SkeletonLoaderProps {
  /** Number of skeleton rows to display (default: 3) */
  count?: number;

  /** Type of skeleton to display - 'list' for simple rows, 'card' for full-width cards, 'table' for row with columns (default: 'list') */
  type?: 'list' | 'card' | 'table';
}

/**
 * Skeleton loader component for displaying loading placeholders.
 *
 * Shows animated placeholder content that mimics the shape and layout of actual content.
 * Use during initial data load or while async operations complete to improve perceived performance.
 * Supports three layout types: simple list, full cards, or table-style rows.
 *
 * @example
 * ```tsx
 * // Show 5 list-style skeletons while loading
 * {isLoading ? <SkeletonLoader count={5} type="list" /> : <DataList />}
 *
 * // Show 3 card skeletons
 * <SkeletonLoader count={3} type="card" />
 *
 * // Show 4 table-style skeletons
 * <SkeletonLoader count={4} type="table" />
 * ```
 *
 * @param props - The component props
 * @param props.count - Number of skeleton items to render (default: 3)
 * @param props.type - Layout type: 'list' (default), 'card', or 'table'
 * @returns The skeleton loader component
 */
export function SkeletonLoader({ count = 3, type = 'list' }: SkeletonLoaderProps) {
  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-lg p-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
              <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2" />
            </div>
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-surface)] rounded-lg h-16 animate-pulse" />
      ))}
    </div>
  );
}
