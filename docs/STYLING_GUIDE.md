# Unified Design System & Styling Guide

This document explains how to maintain visual consistency across Pulseport's UI.

## Overview

The Pulseport app now uses a unified design system with consistent colors, typography, spacing, and components across all pages and sections.

### Key Files

- **`src/styles/design-system.css`** - Core CSS classes for all components
- **`src/styles/theme-utilities.ts`** - Reusable style objects and utilities for React components

## Using the Design System

### 1. Page Layouts

All pages should use the `.page-shell` class:

```tsx
<motion.div
  className="page-shell page-shell--spaced"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  {/* Page content */}
</motion.div>
```

**Variants:**
- `.page-shell` - Base page container
- `.page-shell--spaced` - Adds flex column layout with gap
- `.page-shell--with-header` - Adds larger gap for sections with headers

### 2. Page Headers

Use semantic header classes for consistent typography:

```tsx
<div className="page-header-content">
  <p className="page-kicker">Section Label</p>
  <h1 className="page-title">Page Title</h1>
  <p className="page-subtitle">Description text here</p>
</div>
```

**Classes:**
- `.page-kicker` - Small uppercase label (11px, muted)
- `.page-title` - Main title (28px, bold)
- `.page-subtitle` - Descriptive text (14px, muted)

### 3. Cards & Sections

Use `.card` class for content containers:

```tsx
<div className="card">
  <div className="section-title">Holdings</div>
  {/* Card content */}
</div>
```

**Variants:**
- `.card` - Standard padding (1.5rem)
- `.card.card--compact` - Reduced padding (1rem)
- `.card.card--spacious` - Increased padding (2rem)

### 4. Stats & Metrics

Use the stats grid for displaying key numbers:

```tsx
<div className="stats-grid">
  <div className="stat">
    <p className="stat-label">Total Value</p>
    <p className="stat-value">$45,230</p>
  </div>
  <div className="stat">
    <p className="stat-label">PnL</p>
    <p className="stat-value stat-value--positive">+$2,150</p>
  </div>
</div>
```

**Classes:**
- `.stats-grid` - Responsive grid layout
- `.stat` - Individual stat container
- `.stat-label` - Label text (small, uppercase)
- `.stat-value` - Value display (large, bold)
- `.stat-value--positive` - Green color for positive values
- `.stat-value--negative` - Red color for negative values
- `.stat-subtext` - Optional subtitle

### 5. Control Bars & Filters

For action bars and filter buttons:

```tsx
<div className="control-bar">
  <div className="control-bar-header">
    <div className="control-bar-title">
      <p className="control-bar-title-label">Filters</p>
      <h2 className="control-bar-title-heading">Transactions</h2>
    </div>
    <div className="control-bar-actions">
      <button className="filter-pill">Filter 1</button>
      <button className="filter-pill active">Active</button>
      <button className="export-button">Export CSV</button>
    </div>
  </div>
</div>
```

**Classes:**
- `.control-bar` - Main container
- `.control-bar-header` - Header with title and actions
- `.filter-pill` - Filter/toggle buttons
- `.filter-pill.active` - Active filter state
- `.export-button` - Action button

### 6. Using Theme Utilities in React

Import and use style utilities for inline styling:

```tsx
import { 
  pageHeaderStyle, 
  cardStyle, 
  statGridStyle,
  spacing,
  fontSize,
  typography
} from '../styles/theme-utilities';

function MyComponent() {
  return (
    <div style={pageHeaderStyle}>
      <div style={{ ...typography.pageTitle }}>Title</div>
      <div style={cardStyle}>
        <div style={statGridStyle}>
          {/* Stats */}
        </div>
      </div>
    </div>
  );
}
```

**Available Utilities:**
- `spacing` - Spacing values (xs, sm, md, lg, xl, 2xl)
- `fontSize` - Font size values (xs to 4xl)
- `fontWeight` - Font weights (normal, medium, semibold, bold, extrabold)
- `typography` - Pre-built typography objects
- `pageContainerStyle` - Standard page container styling
- `cardStyle` / `cardCompactStyle` / `cardSpacedStyle` - Card variants
- `statGridStyle` - Stats grid layout
- `filterPillStyle` - Filter button styling

## Color System

Colors are managed through CSS variables in `src/index.css`:

**Text Colors:**
- `var(--fg)` - Primary text
- `var(--fg-muted)` - Secondary/muted text
- `var(--fg-subtle)` - Tertiary text

**Background Colors:**
- `var(--bg-surface)` - Card backgrounds
- `var(--bg-elevated)` - Elevated elements, hover states
- `var(--bg-input)` - Form inputs
- `var(--bg-void)` - Page background

**Semantic Colors:**
- `var(--positive)` - Success/green
- `var(--negative)` - Error/red
- `var(--border)` - Border color
- `var(--shell-accent)` - Accent color (default: #8b5cf6)

## Responsive Design

The design system is mobile-responsive by default. Key breakpoints:

- **Desktop:** Full layout
- **Tablet (≤1024px):** Adjusted spacing and layouts
- **Mobile (≤768px):** Single column, larger touch targets

### Responsive Tips

1. **Use `stats-grid`** - Automatically responsive
2. **Use `control-bar` variants** - Flex layout adapts to screen size
3. **Avoid fixed widths** - Use percentages or max-width
4. **Test on mobile** - All changes should work on small screens

## Spacing & Gaps

Always use the spacing scale:

```
xs:   0.25rem (4px)
sm:   0.5rem  (8px)
md:   1rem    (16px)
lg:   1.5rem  (24px)
xl:   2rem    (32px)
2xl:  2.5rem  (40px)
```

Example:
```tsx
<div style={{ gap: spacing.md }}>
  {/* Content with 16px gaps */}
</div>
```

## Typography Scale

Use consistent font sizes from the typography scale:

```
xs:   11px
sm:   12px
base: 13px
md:   14px
lg:   16px
xl:   18px
2xl:  20px
3xl:  28px
4xl:  32px
```

## Common Patterns

### Page Template

```tsx
<motion.div className="page-shell page-shell--spaced">
  <div className="page-header-content">
    <p className="page-kicker">Section</p>
    <h1 className="page-title">Page Title</h1>
    <p className="page-subtitle">Description</p>
  </div>

  <div className="card">
    <div className="section-title">Section</div>
    <div className="stats-grid">
      {/* Stats */}
    </div>
  </div>

  <div className="card">
    <div className="control-bar-header">
      <h2 className="control-bar-title-heading">Data</h2>
      <div className="control-bar-actions">
        <button className="filter-pill">Filter</button>
      </div>
    </div>
    {/* Content */}
  </div>
</motion.div>
```

### Hero Card (Large Stats)

```tsx
<div className="card card--spacious">
  <div className="section-title">My Portfolio</div>
  <div style={{ fontSize: fontSize['3xl'], fontWeight: fontWeight.bold }}>
    $123,456
  </div>
  <div className="stats-grid">
    {/* Supporting stats */}
  </div>
</div>
```

## Migration from Old Styles

### Old → New Mapping

| Old Class | New Class |
|-----------|-----------|
| `overview-page-shell` | `page-shell` |
| `transaction-page-shell` | `page-shell` |
| `portfolio-page-shell` | `page-shell` |
| `transaction-page-title` | `page-title` |
| `transaction-page-kicker` | `page-kicker` |
| `transaction-page-stat` | `stat` |
| `transaction-page-head` | `card` |
| `filter-pill` | `filter-pill` (unchanged) |
| `history-csv-btn` | `export-button` |

## Checklist for New Components

When adding a new page or component, ensure:

- [ ] Uses `.page-shell` or `.card` for containers
- [ ] Headers use `.page-title`, `.page-subtitle`, `.page-kicker`
- [ ] Stats use `.stats-grid` and `.stat` classes
- [ ] Buttons use `.filter-pill` or `.export-button` styles
- [ ] Spacing follows the spacing scale (md, lg, xl, etc.)
- [ ] Typography uses font sizes from the scale
- [ ] Colors use CSS variables, not hardcoded hex codes
- [ ] Responsive on mobile (tested at 375px width)
- [ ] Consistent with other pages visually

## Troubleshooting

**Styles not applying?**
1. Check that `design-system.css` is imported in `main.tsx`
2. Verify class names are spelled correctly
3. Check CSS cascade - specificity might be overridden
4. Use browser DevTools to inspect element styles

**Typography looks inconsistent?**
1. Use theme classes instead of inline styles where possible
2. Check that font sizes are from the scale
3. Verify line-height is set for readability
4. Ensure proper contrast ratios

**Layout breaking on mobile?**
1. Use responsive grid/flex classes
2. Avoid fixed widths
3. Test on multiple screen sizes
4. Use CSS media queries sparingly (system handles most)

## Questions?

Refer to `src/styles/design-system.css` for the complete class reference, or `src/styles/theme-utilities.ts` for available utilities and helper functions.
