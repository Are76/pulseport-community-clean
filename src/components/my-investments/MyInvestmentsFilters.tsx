interface MyInvestmentsFiltersProps {
  activeFilter: 'all' | 'pulsechain' | 'ethereum' | 'base';
  counts: Record<'all' | 'pulsechain' | 'ethereum' | 'base', number>;
  onChange: (filter: 'all' | 'pulsechain' | 'ethereum' | 'base') => void;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pulsechain', label: 'PulseChain' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
] as const;

export function MyInvestmentsFilters({ activeFilter, counts, onChange }: MyInvestmentsFiltersProps) {
  return (
    <section className="control-bar">
      <div className="control-bar-header">
        <div className="control-bar-title">
          <p className="control-bar-title-label">Current Bag</p>
          <h2 className="control-bar-title-heading">Holdings Attribution</h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--fg-muted)', margin: 0 }}>Filter the live bag by chain, then open a row for source capital, P&amp;L, and route context.</p>
      </div>
      <div className="control-bar-actions" aria-label="Chain filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`filter-pill ${activeFilter === filter.id ? 'active' : ''}`}
            aria-pressed={activeFilter === filter.id}
            onClick={() => onChange(filter.id)}
          >
            <span>{filter.label}</span>
            <small style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({counts[filter.id]})</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export type { MyInvestmentsFiltersProps };
