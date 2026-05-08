import React from 'react';
import { cn } from '../lib/utils';

/**
 * Props for the PriceDisplay component.
 */
interface PriceDisplayProps {
  /** The numeric price value to display */
  price: number;

  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * Formatted price display component with smart decimal handling.
 *
 * Displays prices with appropriate decimal places and handles very small numbers
 * (below $0.0001) by using subscript notation for cleaner display.
 * Uses monospace font for alignment and applies locale-specific formatting.
 *
 * @example
 * ```tsx
 * <PriceDisplay price={1234.56} />           // $1,234.56
 * <PriceDisplay price={0.00001} />           // $0.0₅1
 * <PriceDisplay price={0.5} className="text-green-500" />
 * ```
 *
 * @param props - The component props
 * @param props.price - The numeric price value to format and display
 * @param props.className - Optional CSS classes for custom styling
 * @returns The formatted price display component
 */
export function PriceDisplay({ price, className }: PriceDisplayProps) {
  if (price === 0) return <span className={className}>$0.00</span>;

  // Handle very small prices with subscript for zeros
  if (price < 0.0001 && price > 0) {
    const priceStr = price.toFixed(12);
    const match = priceStr.match(/^0\.0+(?=[1-9])/);
    if (match) {
      const zerosCount = match[0].length - 2;
      const remaining = priceStr.slice(match[0].length);
      return (
        <span className={cn("font-mono", className)}>
          $0.0<sub className="price-sub">{zerosCount}</sub>{remaining.slice(0, 4)}
        </span>
      );
    }
  }

  return (
    <span className={cn("font-mono", className)}>
      ${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: price < 1 ? 6 : 2
      })}
    </span>
  );
}
