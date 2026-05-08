import React from 'react';

/**
 * Props for the LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  /** The size of the spinner ('sm' = 4x4, 'md' = 8x8, 'lg' = 12x12) (default: 'md') */
  size?: 'sm' | 'md' | 'lg';

  /** Optional label text to display below the spinner */
  label?: string;
}

/**
 * A simple animated loading spinner with optional label.
 *
 * Displays a rotating border spinner that indicates loading state.
 * Useful for showing progress during async operations like data fetching.
 *
 * @example
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner />
 *
 * // Spinner with label
 * <LoadingSpinner size="lg" label="Loading data..." />
 * ```
 *
 * @param props - The component props
 * @param props.size - Size of the spinner (default: 'md')
 * @param props.label - Optional label text displayed below the spinner
 * @returns The spinner component
 */
export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-700 border-t-[var(--accent)] rounded-full animate-spin`}
      />
      {label && <p className="text-sm text-[var(--fg-muted)]">{label}</p>}
    </div>
  );
}
