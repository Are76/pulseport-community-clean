/**
 * Constants extracted from App.tsx
 */

// -- HEX addresses (bridged versions) -----------------------------------------

export const EHEX_PULSECHAIN_ADDR = '0x57fde0a71132198bbec939b98976993d8d89d225'; // Bridged HEX (eHEX) on PulseChain
export const ETH_HEX_ADDR = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'; // HEX on Ethereum/PulseChain

// -- ERC20 ABI ----------------------------------------------------------------

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
] as const;

// -- Wallet indicator colors --------------------------------------------------

export const WALLET_DOT_COLORS = ['#00FF9F','#f739ff','#627EEA','#f97316','#a855f7','#f59e0b','#06b6d4','#ec4899'];

// -- Chain colors (for UI indicators) -----------------------------------------

export const CHAIN_COLORS: Record<string, string> = {
  pulsechain: '#f739ff',
  ethereum: '#627EEA',
  base: '#0052FF',
};

// -- Chain labels (for display) -----------------------------------------------

export const CHAIN_LABELS: Record<string, string> = {
  pulsechain: 'PulseChain',
  ethereum: 'Ethereum',
  base: 'Base',
};

// -- Static token logos (curated overrides) -----------------------------------
// Keyed by lowercase contract address on PulseChain.
// Nothing may ever overwrite these entries in tokenLogos or asset.logoUrl.

export const STATIC_LOGOS: Record<string, string> = {
  '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d': 'https://tokens.app.pulsex.com/images/tokens/0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d.png', // INC
  '0xf6f8db0aba00007681f8faf16a0fda1c9b030b11': 'https://cdn.dexscreener.com/cms/images/ODHYYN7yppDHnd6u?width=64&height=64&fit=crop&quality=95&format=auto', // PRVX
  '0xe33a5ae21f93acec5cfc0b7b0fdbb65a0f0be5cc': 'https://tokens.app.pulsex.com/images/tokens/0xE33A5AE21F93aceC5CfC0b7b0FDBB65A0f0Be5cC.png', // MOST
  '0xefd766ccb38eaf1dfd701853bfce31359239f305': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png', // pDAI (bridged DAI)
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'https://tokens.app.pulsex.com/images/tokens/0x6B175474E89094C44Da98b954EedeAC495271d0F.png', // pDAI system copy
};

// -- Liberty Swap routers (cross-chain bridge detection) ----------------------

export const LIBERTY_SWAP_ROUTERS: Record<string, string> = {
  base: '0xcf3d89aedd07ee94e5c45037581744e2d9f0b9fc',
};

export const LIBERTY_SWAP_SELECTOR = 'dc655e26';

// -- Investment thresholds ----------------------------------------------------

export const MIN_INVESTMENT_THRESHOLD = 100;

// -- Core tokens (for market watch and price cards) ---------------------------

export const CORE_TOKENS = [
  { id: 'PLS',  symbol: 'PLS',  name: 'PulseChain',    priceKey: 'pulsechain',                                                    changeKey: 'pulsechain:native', accent: 'linear-gradient(90deg,#00ff9f,#00cfff)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27.png' },
  { id: 'PLSX', symbol: 'PLSX', name: 'PulseX',        priceKey: 'pulsechain:0x95b303987a60c71504d99aa1b13b4da07b0790ab',            accent: 'linear-gradient(90deg,#ff00bf,#7b00ff)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x95B303987A60C71504D99Aa1b13B4DA07b0790ab.png' },
  { id: 'INC',  symbol: 'INC',  name: 'Incentive',     priceKey: 'pulsechain:0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d',            accent: 'linear-gradient(90deg,#39ff14,#00ff9f)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d.png' },
  { id: 'HEX',  symbol: 'HEX',  name: 'pHEX',          priceKey: 'pulsechain:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',            accent: 'linear-gradient(90deg,#ff6b35,#f7931a)',                                              logo: 'https://tokens.app.pulsex.com/images/tokens/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39.png' },
  { id: 'PRVX', symbol: 'PRVX', name: 'PrivacyX',      priceKey: 'pulsechain:0xf6f8db0aba00007681f8faf16a0fda1c9b030b11',            accent: 'linear-gradient(90deg,#6c3ce1,#b044ff)',                                              logo: 'https://cdn.dexscreener.com/cms/images/ODHYYN7yppDHnd6u?width=64&height=64&fit=crop&quality=95&format=auto' },
  { id: 'eHEX', symbol: 'eHEX', name: 'Ethereum HEX',  priceKey: 'ethereum:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',              accent: 'linear-gradient(90deg,#ff0080,#ff6b35,#ffeb3b,#00ff9f,#00cfff,#7b00ff)',             logo: 'https://cdn.dexscreener.com/cms/images/a46bd12940d8501c2aacdd10ad4780e818bdedaba1ec8eb46b52e4d8313d4a93?width=64&height=64&fit=crop&quality=95&format=auto' },
];

// -- Active tabs (for navigation) ---------------------------------------------

export type ActiveTab = 'home' | 'overview' | 'assets' | 'stakes' | 'history' | 'tracker' | 'wallets' | 'defi' | 'pulsechain-official' | 'pulsechain-community' | 'bridge' | 'wallet-analyzer' | 'holdings';

export const ACTIVE_TABS: ActiveTab[] = ['home', 'overview', 'assets', 'stakes', 'history', 'tracker', 'defi', 'pulsechain-official', 'pulsechain-community', 'bridge', 'wallet-analyzer', 'holdings'];

export const ACTIVE_TAB_STORAGE_KEY = 'pulseport_active_tab';

// -- Portfolio management constants -------------------------------------------

export const DUST_THRESHOLD = 10; // coins below $10 USD
