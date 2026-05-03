/**
 * Unified Theme and Styling Utilities
 *
 * This file provides reusable style objects and utilities to ensure
 * consistent spacing, typography, and colors across all pages and components.
 */

// ─────────────────────────────────────────────────────────────────────────
// SPACING SYSTEM
// ─────────────────────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
} as const;

export const gaps = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SYSTEM
// ─────────────────────────────────────────────────────────────────────────

export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '28px',
  '4xl': '32px',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const typography = {
  pageKicker: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--fg-muted)',
  },
  pageTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: 'var(--fg)',
    letterSpacing: '-0.01em',
  },
  pageSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: 'var(--fg-muted)',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: 'var(--fg)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--fg-muted)',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: 'var(--fg)',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// COMMON STYLE OBJECTS
// ─────────────────────────────────────────────────────────────────────────

export const pageContainerStyle = {
  padding: `${spacing.lg}`,
  maxWidth: '1400px',
  marginLeft: 'auto',
  marginRight: 'auto',
} as const;

export const pageHeaderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.md,
  marginBottom: spacing.lg,
} as const;

export const pageHeaderContentStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.sm,
} as const;

export const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: spacing.lg,
} as const;

export const cardCompactStyle = {
  ...cardStyle,
  padding: spacing.md,
} as const;

export const cardSpacedStyle = {
  ...cardStyle,
  padding: spacing.xl,
} as const;

export const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing.md,
} as const;

export const statStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.sm,
} as const;

export const controlBarStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.md,
} as const;

export const controlBarHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: spacing.md,
} as const;

export const filterPillStyle = {
  padding: '0.4rem 1rem',
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  borderRadius: '20px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--fg-muted)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap' as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Create a grid layout with auto-responsive columns
 */
export function createGridStyle(minColumnWidth: string = '150px', gap: string = spacing.md) {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
    gap,
  };
}

/**
 * Create flexbox layout
 */
export function createFlexStyle(
  direction: 'row' | 'column' = 'row',
  gap: string = spacing.md,
  align: string = 'center'
) {
  return {
    display: 'flex',
    flexDirection: direction,
    gap,
    alignItems: align,
  };
}

/**
 * Merge theme colors with custom overrides
 */
export function mergeColors(overrides: Record<string, string>) {
  return {
    text: 'var(--fg)',
    textSecondary: 'var(--fg-muted)',
    textMuted: 'var(--fg-subtle)',
    bg: 'var(--bg-surface)',
    bgElevated: 'var(--bg-elevated)',
    border: 'var(--border)',
    green: 'var(--positive)',
    red: 'var(--negative)',
    ...overrides,
  };
}
