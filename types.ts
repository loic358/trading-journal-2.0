
export enum TradeType {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  WIN = 'WIN',
  LOSS = 'LOSS',
  BE = 'BREAK_EVEN',
  OPEN = 'OPEN'
}

export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate: string;
  type: TradeType;
  setup: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  quantity: number;
  pnl: number;
  rMultiple: number;
  status: TradeStatus;
  mistakes?: string[]; // e.g., 'FOMO', 'Late Entry'
  screenshotUrl?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BacktestSession {
  id: string;
  name: string;
  symbol: string; // New field for the chart
  strategy: string;
  startDate: string;
  initialBalance: number;
  trades: Trade[];
}

export interface DailyStat {
  date: string;
  pnl: number;
  tradeCount: number;
}

export interface DashboardStats {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgR: number;
  totalTrades: number;
}
