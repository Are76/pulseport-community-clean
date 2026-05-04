import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TAB_STORAGE_KEY,
  APP_SHELL_NAV_GROUPS,
  APP_SHELL_NAV_ITEMS,
  APP_SHELL_PAGE_META,
  getMobileAppShellNav,
  readStoredActiveTab,
} from '../features/app-shell/appShellController';

describe('appShellController', () => {
  it('maps the legacy wallets tab to assets when reading storage', () => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'wallets');

    expect(readStoredActiveTab()).toBe('assets');
  });

  it('returns the persisted tab when it is still supported', () => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'defi');

    expect(readStoredActiveTab()).toBe('defi');
  });

  it('falls back to home when storage contains an unsupported tab', () => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'unsupported');

    expect(readStoredActiveTab()).toBe('home');
  });

  it('exposes the current app shell nav labels and page titles', () => {
    expect(APP_SHELL_NAV_ITEMS.map(item => item.label)).toEqual([
      'Dashboard',
      'Portfolio',
      'HEX Staking',
      'Wallet Analyzer',
      'My Investments',
      'Transactions',
      'DeFi',
    ]);
    expect(APP_SHELL_PAGE_META['wallet-analyzer']).toEqual({
      title: 'Wallet Analyzer',
      subtitle: 'Executive capital readout, recent flows, and next actions by wallet exposure.',
    });
    expect(APP_SHELL_PAGE_META['pulsechain-official']).toEqual({
      title: 'My Investments',
      subtitle: 'Initial capital mapped against current PulseChain ownership.',
    });
    expect(APP_SHELL_NAV_GROUPS).toEqual([
      {
        label: 'Portfolio',
        items: [
          APP_SHELL_NAV_ITEMS[0],
          APP_SHELL_NAV_ITEMS[1],
          APP_SHELL_NAV_ITEMS[2],
        ],
      },
      {
        label: 'Operations',
        items: [
          APP_SHELL_NAV_ITEMS[3],
          APP_SHELL_NAV_ITEMS[4],
          APP_SHELL_NAV_ITEMS[5],
          APP_SHELL_NAV_ITEMS[6],
        ],
      },
    ]);
  });

  it('splits mobile nav into the same primary and more groups used by the live shell', () => {
    const homeNav = getMobileAppShellNav('home');

    expect(homeNav.primaryItems.map(item => item.id)).toEqual(['home', 'overview', 'history']);
    expect(homeNav.moreItems.map(item => item.id)).toEqual(['stakes', 'wallet-analyzer', 'pulsechain-official', 'defi']);
    expect(homeNav.moreActive).toBe(false);
    expect(getMobileAppShellNav('defi').moreActive).toBe(true);
  });
});
