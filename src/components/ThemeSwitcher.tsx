import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

/**
 * Theme switcher button component that toggles between light and dark modes.
 *
 * A small button that displays the current theme and toggles between light and dark modes.
 * Uses icons (sun for light mode, moon for dark mode) for intuitive visual feedback.
 * Integrates with the useTheme hook to manage theme state globally.
 *
 * @example
 * ```tsx
 * // In header
 * <ThemeSwitcher className="ml-2" />
 * ```
 *
 * @param props - Component props
 * @param props.className - Optional CSS class name for custom styling
 * @returns The theme switcher button component
 */
export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-switcher ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLButtonElement;
        target.style.backgroundColor = 'var(--color-bg-tertiary)';
        target.style.borderColor = 'var(--color-border-strong)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLButtonElement;
        target.style.backgroundColor = 'var(--color-bg-secondary)';
        target.style.borderColor = 'var(--color-border)';
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} />
      )}
    </button>
  );
};
