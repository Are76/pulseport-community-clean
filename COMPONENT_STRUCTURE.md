# Component Architecture & Directory Structure Guide

## Overview
This document establishes the recommended directory structure and organization principles for the pulseport-community application.

## Directory Structure

```
src/
├── components/              # Reusable UI components
│   ├── common/             # Globally reusable components (Button, Card, Modal, etc.)
│   ├── my-investments/     # Portfolio/investment specific components
│   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   └── *.tsx               # Individual feature components
├── pages/                  # Top-level page components (mapped to routes)
│   ├── MyInvestmentsPage.tsx
│   ├── WalletAnalyzer.tsx
│   └── *.tsx
├── tabs/                   # Tab pane components (used within App.tsx tabs)
│   ├── HomeTab.tsx
│   ├── OverviewTab.tsx
│   ├── StakesTab.tsx
│   └── *.tsx
├── context/               # React Context providers and hooks
│   ├── PortfolioContext.tsx
│   └── *.tsx
├── hooks/                 # Custom React hooks
│   ├── usePortfolio.ts
│   ├── useTheme.ts
│   └── *.ts
├── utils/                 # Utility functions
│   ├── formatting.ts      # Number, price, currency formatting
│   ├── buildInvestmentRows.ts
│   ├── normalizeTransactions.ts
│   ├── assetHelpers.ts
│   └── *.ts
├── types.ts              # Centralized TypeScript type definitions
├── constants.ts          # Application constants
├── styles/               # Global stylesheets
│   ├── index.css
│   ├── design-system.css
│   └── *.css
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Component Categorization

### 1. Common Components (`/components/common/`)
**Purpose:** Globally reusable, framework-agnostic UI components

**Examples:**
- Button, Input, Select, Checkbox
- Card, Modal, Drawer, Tooltip
- Badge, Chip, Tag
- Spinner, Skeleton, Progress

**Guidelines:**
- Zero domain knowledge (crypto-agnostic)
- No dependencies on context beyond theme
- Full prop-based configuration
- Fully tested with multiple states
- Exported for external reuse

---

### 2. Feature Components (`/components/feature-name/`)
**Purpose:** Components specific to a feature or domain area

**Examples:**
- `/components/my-investments/` - Portfolio components
- `/components/holdings/` - Holdings display
- `/components/defi/` - DeFi-specific components

**Guidelines:**
- May depend on Portfolio context
- Composed from common components
- Use shared formatting utilities
- Organized by feature, not technical type

---

### 3. Layout Components (`/components/layout/`)
**Purpose:** Structural components that define page layout

**Examples:**
- Header
- Sidebar
- Navigation
- Footer
- PageShell

**Guidelines:**
- Typically stateless (receive state via props)
- Compose other components
- Responsive design included
- Reused across pages

---

### 4. Pages (`/pages/`)
**Purpose:** Top-level route components, orchestrate sub-components and state

**Examples:**
- MyInvestmentsPage.tsx
- WalletAnalyzer.tsx

**Guidelines:**
- One component per file (matches one route)
- Orchestrate multiple sub-components
- Handle page-level state and navigation
- Pass data down via props (or context when necessary)

---

### 5. Tabs (`/tabs/`)
**Purpose:** Pane components used within tabbed interfaces (App.tsx tabs)

**Current tabs:**
- HomeTab.tsx - Portfolio overview
- OverviewTab.tsx - Holdings summary
- AssetsTab.tsx - Asset listing
- StakesTab.tsx - Staking information
- DefiTab.tsx - DeFi positions
- HistoryTab.tsx - Transaction history

**Guidelines:**
- Organized by tab name
- May accept tab-specific props (summary, filters, etc.)
- Import centralized utilities (formatting, types)
- Keep complexity within reasonable bounds (< 500 lines preferred)

---

## Import Patterns

### Correct
```typescript
// Formatting utilities
import { fmtPrice, fmtAmount } from '../utils/formatting';

// Types
import type { Asset, Wallet } from '../types';

// Context
import { usePortfolio } from '../context/PortfolioContext';

// Common components
import { Button, Modal } from '../components/common';

// Feature components
import { HoldingsTable } from '../components/my-investments';

// Hooks
import { useTheme } from '../hooks/useTheme';
```

### Incorrect (Anti-patterns)
```typescript
// Don't define formatting in component files
const fmtPrice = (p: number) => ...;

// Don't scatter types across multiple files
interface PortfolioSummary { ... }

// Don't do relative imports like this (prefer barrel exports)
import Button from '../../../components/common/Button';

// Don't import styles directly in components (use CSS classes)
import styles from './Component.module.css';
```

---

## Naming Conventions

### Component Files
- **PascalCase**: Component file names match exported component
  - `HoldingsTable.tsx` exports `HoldingsTable`
  - `MyInvestmentsPage.tsx` exports `MyInvestmentsPage`

### Utility Files
- **camelCase**: Utility files use camelCase
  - `formatting.ts` - Formatting utilities
  - `assetHelpers.ts` - Asset helper functions
  - `normalizeTransactions.ts` - Transaction normalization

### Type Files
- **Single `types.ts`**: All types in one file (not scattered)
- **PascalCase**: Type names use PascalCase
  - `PortfolioSummary`, `Asset`, `Transaction`

---

## Component Size Guidelines

| Component Type | Max Lines | Guideline |
|---|---|---|
| Common component | 300 | Single responsibility, fully reusable |
| Feature component | 400 | Focused on one feature area |
| Tab | 500 | Contains related feature logic |
| Page | 600 | Orchestrates multiple features |
| Utility function | 100 | Pure functions, no side effects |

**If a component exceeds these limits:** Break it into smaller sub-components or extract logic to utilities/hooks.

---

## State Management Principles

### Where to Put State

| State Type | Location | Example |
|---|---|---|
| Global app state | PortfolioContext | wallets, assets, transactions |
| Feature state | Feature component props + local useState | Selected filters, modal open state |
| UI state | Component state | Sidebar open, tab active, etc. |
| Derived state | useMemo/useCallback | Sorted lists, filtered data |

### Context Usage
- **PortfolioContext**: Portfolio data, wallet management, price data
- **ThemeContext**: Theme selection (light/dark)
- **Feature contexts**: Only if > 3 components in feature share state

---

## Code Organization Within Components

```typescript
// 1. Imports (types, utils, components, hooks)
import React, { useState, useCallback } from 'react';
import type { Asset, Wallet } from '../types';
import { fmtPrice } from '../utils/formatting';

// 2. Type definitions (local interfaces/types)
interface LocalComponentState {
  isLoading: boolean;
}

// 3. Constants (local to component)
const MAX_ITEMS = 10;

// 4. Component definition
export function ComponentName(props: ComponentProps) {
  // 4a. State hooks
  const [isLoading, setIsLoading] = useState(false);
  
  // 4b. Context
  const { data } = usePortfolio();
  
  // 4c. Memoized/callback computations
  const sorted = useMemo(() => [...items].sort(), [items]);
  
  // 4d. Event handlers
  const handleClick = useCallback(() => {}, []);
  
  // 4e. Effects
  useEffect(() => {}, []);
  
  // 4f. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## Style & CSS Guidelines

### Recommended Approach
Use **CSS classes from design-system.css** + utility CSS classes

```typescript
// Good: Use design system classes
<div className="page-shell page-shell--spaced">
  <div className="glass-card">
    {/* content */}
  </div>
</div>

// Avoid: Inline styles
<div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)' }}>
  {/* content */}
</div>
```

### Colors
Use CSS variables defined in `/styles/index.css`:
- `--bg-dark`, `--fg`, `--fg-muted`, `--border`
- `--chain-pulse`, `--chain-eth`, `--chain-base`
- `--positive` (green), `--negative` (red)

---

## Testing

### Test File Organization
- Mirror component structure in `/test` directory
- Test files co-located with components

```
src/
├── components/
│   ├── HoldingsTable.tsx
│   └── __tests__/
│       └── HoldingsTable.test.tsx
```

### Testing Conventions
- Use Vitest (already configured)
- Test user interactions, not implementation
- Test with rendered output, not JSX

---

## Refactoring Checklist

When adding new features or refactoring:

- [ ] Types in `types.ts`, not scattered
- [ ] Formatting utilities in `utils/formatting.ts`
- [ ] Components in appropriate subdirectory
- [ ] No duplicate code (check for existing utilities)
- [ ] Uses design system classes, not inline styles
- [ ] Follows naming conventions (PascalCase components, camelCase utils)
- [ ] Component size within guidelines
- [ ] Tests updated/added
- [ ] All tests passing
- [ ] No console errors/warnings

---

## Examples

### Adding a New Feature Component

1. **Create directory**: `src/components/my-new-feature/`
2. **Export from index**: Create `src/components/my-new-feature/index.ts`
   ```typescript
   export { MyComponent } from './MyComponent';
   export { HelperComponent } from './HelperComponent';
   ```
3. **Import in parent**: `import { MyComponent } from '../my-new-feature'`

### Adding a New Utility

1. **Add to existing file** if it fits (e.g., formatting)
2. **Or create new file** in `utils/` with clear purpose
3. **Export from utils**: All functions exported
4. **Import in components**: `import { utilFunc } from '../utils/utilName'`

---

## Migration Plan (App.tsx Decomposition)

As part of ongoing refactoring, App.tsx should gradually move toward:

1. **Reduced size** (< 1000 lines) by extracting tabs
2. **Clearer responsibilities**: Routing + context + layout, not rendering
3. **Extracted utilities**: All helpers in `utils/`
4. **Separated concerns**: State management in context, not App.tsx

**Current state**: 2,311 lines (monolithic)
**Target state**: < 1,000 lines (routing + layout)
**Status**: In progress (Step 3)
