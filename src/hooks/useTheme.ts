import { useState, useEffect, useCallback } from 'react';

export type ThemeType = 'light' | 'dark';

const STORAGE_KEY = 'pulseport_theme';

/**
 * Hook for managing application theme (light/dark mode).
 *
 * Handles theme state management with localStorage persistence and system preference detection.
 * Automatically initializes from saved preference or system color scheme preference.
 * Updates the document's data-theme attribute for CSS-based theming.
 *
 * @example
 * ```tsx
 * const { theme, toggleTheme, setTheme } = useTheme();
 * return (
 *   <button onClick={toggleTheme}>
 *     Current theme: {theme}
 *   </button>
 * );
 * ```
 *
 * @returns Theme state and control functions
 * @returns {ThemeType} returns.theme - Current theme ('light' or 'dark')
 * @returns {function} returns.toggleTheme - Toggle between light and dark mode
 * @returns {function} returns.setTheme - Set theme to specific value
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeType | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = stored || systemPreference;

    setThemeState(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  // Toggle theme and persist
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      return newTheme;
    });
  }, []);

  // Set specific theme
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return { theme, toggleTheme, setTheme };
};
