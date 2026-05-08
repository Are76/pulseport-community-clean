import React from 'react';
import { Eye, EyeOff, Zap } from 'lucide-react';

interface CoinFiltersProps {
  showHiddenCoins: boolean;
  onToggleHidden: () => void;
  showDustFilter: boolean;
  onToggleDustFilter: () => void;
  hiddenCount: number;
  dustCount: number;
}

export function CoinFilters({
  showHiddenCoins,
  onToggleHidden,
  showDustFilter,
  onToggleDustFilter,
  hiddenCount,
  dustCount,
}: CoinFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={onToggleHidden}
        title={showHiddenCoins ? 'Hide hidden coins' : 'Show hidden coins'}
        aria-label={showHiddenCoins ? 'Hide hidden coins' : 'Show hidden coins'}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          showHiddenCoins
            ? 'bg-purple-500 border-purple-500 text-white'
            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {showHiddenCoins ? <Eye size={16} /> : <EyeOff size={16} />}
        Hidden ({hiddenCount})
      </button>

      <button
        onClick={onToggleDustFilter}
        title={showDustFilter ? 'Disable dust filter' : 'Enable dust filter'}
        aria-label={showDustFilter ? 'Disable dust filter' : 'Enable dust filter'}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          showDustFilter
            ? 'bg-orange-500 border-orange-500 text-white'
            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Zap size={14} />
        Dust ({dustCount})
      </button>
    </div>
  );
}
