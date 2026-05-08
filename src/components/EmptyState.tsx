import React from 'react';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
  /** Optional icon/emoji to display above the title */
  icon?: React.ReactNode;

  /** Main title text for the empty state */
  title: string;

  /** Optional description text providing more context */
  description?: string;

  /** Optional action button with label and click handler */
  action?: {
    /** Button label text */
    label: string;

    /** Callback function when button is clicked */
    onClick: () => void;
  };
}

/**
 * Empty state component for displaying empty lists or no-data states.
 *
 * Shows a centered message with optional icon, description, and action button.
 * Use when a list is empty, search yields no results, or data has not been loaded yet.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📭"
 *   title="No transactions yet"
 *   description="Start investing to see your transaction history here"
 *   action={{
 *     label: "Start Investing",
 *     onClick: () => handleStartInvesting()
 *   }}
 * />
 * ```
 *
 * @param props - The component props
 * @param props.icon - Optional icon/emoji for visual emphasis
 * @param props.title - The main message title
 * @param props.description - Optional supporting text
 * @param props.action - Optional button with label and onClick handler
 * @returns The empty state component
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--fg-muted)] mb-6 max-w-sm text-center text-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
