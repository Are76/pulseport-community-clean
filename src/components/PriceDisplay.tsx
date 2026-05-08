import React from 'react';
import { cn } from '../lib/utils';

interface PriceDisplayProps {
  price: number;
  className?: string;
}

export function PriceDisplay({ price, className }: PriceDisplayProps) {
  if (price === 0) return <span className={cn("font-mono", className)}>$0.00</span>;

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

  // Detect price > 0 but less than smallest displayable value (< 0.000001)
  const maxFractionDigits = price < 1 ? 6 : 2;
  const minDisplayable = Math.pow(10, -maxFractionDigits);
  if (price > 0 && price < minDisplayable) {
    return (
      <span className={cn("font-mono", className)}>
        &lt;${minDisplayable.toLocaleString('en-US', {
          minimumFractionDigits: maxFractionDigits,
          maximumFractionDigits: maxFractionDigits
        })}
      </span>
    );
  }

  return (
    <span className={cn("font-mono", className)}>
      ${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: maxFractionDigits
      })}
    </span>
  );
}
