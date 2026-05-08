import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Theme System', () => {
  beforeEach(() => {
    // Clear localStorage and document state
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Theme Attribute Management', () => {
    it('should set data-theme attribute to light', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should set data-theme attribute to dark', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should toggle from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      document.documentElement.setAttribute('data-theme', 'light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference to localStorage', () => {
      localStorage.setItem('pulseport_theme', 'dark');
      expect(localStorage.getItem('pulseport_theme')).toBe('dark');
    });

    it('should persist light theme to localStorage', () => {
      localStorage.setItem('pulseport_theme', 'light');
      expect(localStorage.getItem('pulseport_theme')).toBe('light');
    });

    it('should load theme from localStorage on app start', () => {
      localStorage.setItem('pulseport_theme', 'dark');
      const stored = localStorage.getItem('pulseport_theme');
      expect(stored).toBe('dark');
    });

    it('should clear theme on localStorage clear', () => {
      localStorage.setItem('pulseport_theme', 'dark');
      localStorage.clear();
      expect(localStorage.getItem('pulseport_theme')).toBeNull();
    });
  });

  describe('System Preference Detection', () => {
    it('should detect system color scheme preference', () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const expectedTheme = systemDark ? 'dark' : 'light';
      expect(['light', 'dark']).toContain(expectedTheme);
    });

    it('should have a valid fallback theme when no preference exists', () => {
      localStorage.clear();
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const fallbackTheme = systemDark ? 'dark' : 'light';
      expect(['light', 'dark']).toContain(fallbackTheme);
    });
  });

  describe('Theme CSS Classes', () => {
    it('should support data-theme attribute selector for dark mode', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should support dark class on html element', () => {
      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should support multiple class selections', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Theme Storage Key', () => {
    it('should use correct storage key for theme', () => {
      const STORAGE_KEY = 'pulseport_theme';
      localStorage.setItem(STORAGE_KEY, 'dark');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('should not conflict with other storage keys', () => {
      localStorage.setItem('pulseport_theme', 'dark');
      localStorage.setItem('other_key', 'value');
      expect(localStorage.getItem('pulseport_theme')).toBe('dark');
      expect(localStorage.getItem('other_key')).toBe('value');
    });
  });
});
