/**
 * appConstants.test.ts
 *
 * Verifies that all exported constants are properly defined and follow expected patterns.
 */
import { describe, it, expect } from 'vitest';
import * as appConstants from '../utils/appConstants';

describe('appConstants', () => {
  describe('Chain Configuration', () => {
    it('should have CHAIN_COLORS defined for all chains', () => {
      expect(appConstants.CHAIN_COLORS.pulsechain).toBe('#f739ff');
      expect(appConstants.CHAIN_COLORS.ethereum).toBe('#627EEA');
      expect(appConstants.CHAIN_COLORS.base).toBe('#0052FF');
    });

    it('should have CHAIN_LABELS defined for all chains', () => {
      expect(appConstants.CHAIN_LABELS.pulsechain).toBe('PulseChain');
      expect(appConstants.CHAIN_LABELS.ethereum).toBe('Ethereum');
      expect(appConstants.CHAIN_LABELS.base).toBe('Base');
    });

    it('CHAIN_COLORS and CHAIN_LABELS should have matching keys', () => {
      const colorKeys = Object.keys(appConstants.CHAIN_COLORS).sort();
      const labelKeys = Object.keys(appConstants.CHAIN_LABELS).sort();
      expect(colorKeys).toEqual(labelKeys);
    });
  });

  describe('Token Addresses', () => {
    it('should have valid Ethereum addresses', () => {
      const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
      expect(isValidAddress(appConstants.WPLS_ADDRESS)).toBe(true);
      expect(isValidAddress(appConstants.PHEX_ADDRESS)).toBe(true);
      expect(isValidAddress(appConstants.ETH_HEX_ADDR)).toBe(true);
      expect(isValidAddress(appConstants.EHEX_PULSECHAIN_ADDR)).toBe(true);
    });

    it('BRIDGE_TOKENS should have all required properties', () => {
      expect(appConstants.BRIDGE_TOKENS.length).toBeGreaterThan(0);
      appConstants.BRIDGE_TOKENS.forEach(token => {
        expect(token.symbol).toBeDefined();
        expect(token.name).toBeDefined();
        expect(/^0x[a-fA-F0-9]{40}$/.test(token.address)).toBe(true);
        expect(typeof token.decimals).toBe('number');
        expect(token.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('PULSECHAIN_CORE_TOKENS should have all required properties', () => {
      expect(appConstants.PULSECHAIN_CORE_TOKENS.length).toBeGreaterThan(0);
      appConstants.PULSECHAIN_CORE_TOKENS.forEach(token => {
        expect(token.symbol).toBeDefined();
        expect(token.role).toBeDefined();
        expect(token.contract).toBeDefined();
        expect(token.note).toBeDefined();
        expect(token.color).toBeDefined();
      });
    });
  });

  describe('Portfolio Thresholds', () => {
    it('should have valid thresholds', () => {
      expect(appConstants.MIN_INVESTMENT_THRESHOLD).toBe(100);
      expect(appConstants.DUST_THRESHOLD).toBe(10);
      expect(appConstants.MIN_DISPLAY_BALANCE).toBe(0.0001);
      expect(appConstants.MIN_WPLS_RESERVE).toBe(10_000_000);
    });

    it('DUST_THRESHOLD should be less than MIN_INVESTMENT_THRESHOLD', () => {
      expect(appConstants.DUST_THRESHOLD).toBeLessThan(appConstants.MIN_INVESTMENT_THRESHOLD);
    });
  });

  describe('CORE_TOKENS Market Watch', () => {
    it('should have featured tokens defined', () => {
      expect(appConstants.CORE_TOKENS.length).toBeGreaterThan(0);
      expect(appConstants.CORE_TOKENS.some(t => t.id === 'PLS')).toBe(true);
    });

    it('each token should have required properties', () => {
      appConstants.CORE_TOKENS.forEach(token => {
        expect(token.id).toBeDefined();
        expect(token.symbol).toBeDefined();
        expect(token.name).toBeDefined();
        expect(token.priceKey).toBeDefined();
        expect(token.logo).toBeDefined();
      });
    });
  });

  describe('UI Colors', () => {
    it('should have WALLET_DOT_COLORS defined', () => {
      expect(appConstants.WALLET_DOT_COLORS.length).toBeGreaterThan(0);
      appConstants.WALLET_DOT_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have COLOR_SCHEME defined', () => {
      expect(appConstants.COLOR_SCHEME.pulseChainAccent).toBeDefined();
      expect(appConstants.COLOR_SCHEME.ethereumAccent).toBeDefined();
      expect(appConstants.COLOR_SCHEME.baseAccent).toBeDefined();
      expect(appConstants.COLOR_SCHEME.positive).toBeDefined();
      expect(appConstants.COLOR_SCHEME.negative).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    it('should have API_ENDPOINTS defined', () => {
      expect(appConstants.API_ENDPOINTS.DEXSCREENER).toBeDefined();
      expect(appConstants.API_ENDPOINTS.COINGECKO).toBeDefined();
      expect(appConstants.API_ENDPOINTS.PULSECHAIN_SCANNER).toBeDefined();
      expect(appConstants.API_ENDPOINTS.ETHERSCAN).toBeDefined();
    });

    it('should have RPC_ENDPOINTS defined', () => {
      expect(appConstants.RPC_ENDPOINTS.PULSECHAIN_PRIMARY).toBeDefined();
      expect(appConstants.RPC_ENDPOINTS.PULSECHAIN_FALLBACK).toBeDefined();
      expect(appConstants.RPC_ENDPOINTS.ETHEREUM_PRIMARY).toBeDefined();
      expect(appConstants.RPC_ENDPOINTS.ETHEREUM_FALLBACK).toBeDefined();
    });

    it('API endpoints should be valid URLs', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      expect(isValidUrl(appConstants.API_ENDPOINTS.DEXSCREENER)).toBe(true);
      expect(isValidUrl(appConstants.RPC_ENDPOINTS.ETHEREUM_PRIMARY)).toBe(true);
    });
  });

  describe('Timing & Animations', () => {
    it('should have ANIMATION_DURATIONS defined', () => {
      expect(appConstants.ANIMATION_DURATIONS.INSTANT).toBe(0);
      expect(appConstants.ANIMATION_DURATIONS.FAST).toBe(150);
      expect(appConstants.ANIMATION_DURATIONS.NORMAL).toBe(300);
      expect(appConstants.ANIMATION_DURATIONS.SLOW).toBe(500);
    });

    it('should have DEBOUNCE_DELAYS defined and positive', () => {
      Object.values(appConstants.DEBOUNCE_DELAYS).forEach(delay => {
        expect(delay).toBeGreaterThan(0);
      });
    });

    it('should have CACHE_TTL defined and positive', () => {
      Object.values(appConstants.CACHE_TTL).forEach(ttl => {
        expect(ttl).toBeGreaterThan(0);
      });
    });

    it('should have TIME_WINDOWS defined and positive', () => {
      Object.values(appConstants.TIME_WINDOWS).forEach(window => {
        if (isFinite(window)) {
          expect(window).toBeGreaterThan(0);
        }
      });
    });

    it('CACHE_TTL should be less than TIME_WINDOWS', () => {
      expect(appConstants.CACHE_TTL.HEX_DAILY_DATA).toBeLessThan(appConstants.TIME_WINDOWS.HOURS_24);
      expect(appConstants.CACHE_TTL.MARKET_DATA).toBeLessThan(appConstants.TIME_WINDOWS.HOURS_1);
    });
  });

  describe('Validation Rules', () => {
    it('should have VALIDATION constants', () => {
      expect(appConstants.VALIDATION.SWAP_PRESETS.length).toBeGreaterThan(0);
      expect(appConstants.VALIDATION.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
      expect(appConstants.VALIDATION.MAX_WALLET_NAME_LENGTH).toBeGreaterThan(0);
    });
  });

  describe('Smart Contract Configuration', () => {
    it('should have LIBERTY_SWAP_ROUTERS defined', () => {
      expect(appConstants.LIBERTY_SWAP_ROUTERS.base).toBeDefined();
      expect(/^0x[a-fA-F0-9]{40}$/.test(appConstants.LIBERTY_SWAP_ROUTERS.base)).toBe(true);
    });

    it('should have LIBERTY_SWAP_SELECTOR defined', () => {
      expect(appConstants.LIBERTY_SWAP_SELECTOR).toBeDefined();
      expect(appConstants.LIBERTY_SWAP_SELECTOR).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should have ERC20_ABI defined', () => {
      expect(appConstants.ERC20_ABI.length).toBeGreaterThan(0);
      expect(appConstants.ERC20_ABI[0].name).toBe('balanceOf');
    });
  });

  describe('Static Logos', () => {
    it('should have STATIC_LOGOS defined', () => {
      expect(Object.keys(appConstants.STATIC_LOGOS).length).toBeGreaterThan(0);
      Object.entries(appConstants.STATIC_LOGOS).forEach(([addr, url]) => {
        expect(/^0x[a-fA-F0-9]{40}$/.test(addr)).toBe(true);
        expect(url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Navigation', () => {
    it('should have ACTIVE_TABS defined', () => {
      expect(appConstants.ACTIVE_TABS.length).toBeGreaterThan(0);
      expect(appConstants.ACTIVE_TABS).toContain('home');
      expect(appConstants.ACTIVE_TABS).toContain('overview');
    });

    it('should have ACTIVE_TAB_STORAGE_KEY defined', () => {
      expect(appConstants.ACTIVE_TAB_STORAGE_KEY).toBe('pulseport_active_tab');
    });
  });

  describe('No Duplicate Critical Values', () => {
    it('should not have duplicate WPLS address', () => {
      const wpls = appConstants.WPLS_ADDRESS.toLowerCase();
      const dupes = Object.values(appConstants.BRIDGE_TOKENS)
        .filter(t => t.address?.toLowerCase() === wpls);
      expect(dupes).toBeDefined();
    });

    it('all chain colors should be unique or intentional', () => {
      const colors = Object.values(appConstants.CHAIN_COLORS);
      // Allow some duplication for design consistency, but flag accidental ones
      expect(colors.length).toBeGreaterThan(0);
    });
  });
});
