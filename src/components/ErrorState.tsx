import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Props for the ErrorState component.
 */
export interface ErrorStateProps {
  /** Error title displayed in bold */
  title: string;

  /** Detailed error message */
  message: string;

  /** Optional callback to retry the failed operation */
  onRetry?: () => void;
}

/**
 * Error state component for displaying error messages.
 *
 * Shows a prominent red alert box with icon, title, message, and optional retry button.
 * Use when an operation fails and you need to inform the user of the error.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load holdings"
 *   message="Unable to fetch wallet data. Please check your connection and try again."
 *   onRetry={() => refetchWallet()}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.title - Error title (e.g., "Loading failed")
 * @param props.message - Detailed error message for the user
 * @param props.onRetry - Optional callback function for retry button
 * @returns The error state component
 */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.28)] text-[var(--negative)] p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm opacity-90 mb-3">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
