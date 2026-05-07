import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { DUST_THRESHOLD } from '../../utils/appConstants';

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  value: number;
  price: number;
  chain: string;
  isHidden?: boolean;
  logoUrl?: string;
}

interface CoinListProps {
  coins: CoinData[];
  hiddenCoins: string[];
  showDustFilter: boolean;
  onHideToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatBalance(balance: number): string {
  if (Math.abs(balance) >= 1e9) return `${(balance / 1e9).toFixed(2)}B`;
  if (Math.abs(balance) >= 1e6) return `${(balance / 1e6).toFixed(2)}M`;
  if (Math.abs(balance) >= 1e3) return `${(balance / 1e3).toFixed(2)}K`;
  return balance.toLocaleString('en-US', {
    maximumFractionDigits: balance < 1 ? 8 : 2,
  });
}

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(10)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function CoinList({
  coins,
  hiddenCoins,
  showDustFilter,
  onHideToggle,
  onRemove,
}: CoinListProps) {
  const isDust = (coin: CoinData) => coin.value < DUST_THRESHOLD;
  const isHidden = (coin: CoinData) => hiddenCoins.includes(coin.id);

  const filtered = coins.filter((coin) => {
    const hidden = isHidden(coin);
    const dust = isDust(coin);

    // Always show non-hidden coins
    if (!hidden) {
      // If dust filter is on, hide dust coins
      if (showDustFilter && dust) {
        return false;
      }
      return true;
    }

    // For hidden coins, only show if they should be visible
    // (This will be determined by the parent component)
    return false;
  });

  if (filtered.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No coins to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((coin) => {
        const dust = isDust(coin);
        const hidden = isHidden(coin);

        return (
          <div
            key={coin.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              hidden
                ? 'bg-gray-100 border-gray-300 opacity-60'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Coin Logo */}
            <div className="flex-shrink-0">
              {coin.logoUrl ? (
                <img
                  src={coin.logoUrl}
                  alt={coin.symbol}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                  {coin.symbol.substring(0, 2)}
                </div>
              )}
            </div>

            {/* Coin Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{coin.symbol}</h3>
                {dust && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    Dust
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{coin.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatBalance(coin.balance)} • {formatPrice(coin.price)}
              </p>
            </div>

            {/* Value */}
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900">
                {formatValue(coin.value)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{coin.chain}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onHideToggle(coin.id)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                title={hidden ? 'Show coin' : 'Hide coin'}
              >
                {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={() => onRemove(coin.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                title="Remove coin"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
