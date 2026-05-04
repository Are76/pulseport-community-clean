export type Chain = 'pulsechain' | 'ethereum' | 'base';
export type ViewMode = 'combined' | 'per-wallet';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface HoldingToken {
  address: string;
  chain: Chain;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  currentPrice: number;
  amount: number;
  value: number; // USD value
  change24h?: number;
  holders?: number;
  contractAge?: number; // Days
  volume24h?: number;
}

export interface FilterState {
  dust: boolean;
  chains: Chain[];
  valueRange: [number, number];
  tokenType: ('erc20' | 'lp' | 'custom')[];
  spamDetection: boolean;
  sort: 'value' | 'ownership' | 'age';
}

export interface RiskScoreResult {
  score: number; // 0-100
  level: RiskLevel;
  factors: {
    holderConcentration: number;
    contractAge: number;
    volumeAnomaly: number;
    blacklistMatch: boolean;
  };
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
}

export interface ScanResult {
  token: HoldingToken;
  riskScore: RiskScoreResult;
  shouldHide: boolean;
}

export interface WalletGroup {
  address: string;
  chain?: string;
  tokens: HoldingToken[];
  totalValue: number;
}
