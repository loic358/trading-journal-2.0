
import { Trade, TradeStatus, TradeType, DailyStat, BacktestSession } from './types';

export const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    symbol: 'ES_F',
    entryDate: '2023-10-25 09:35',
    exitDate: '2023-10-25 10:15',
    type: TradeType.SHORT,
    setup: 'Opening Drive',
    entryPrice: 4250.50,
    exitPrice: 4230.00,
    quantity: 2,
    pnl: 2050.00,
    rMultiple: 2.5,
    status: TradeStatus.WIN,
    mistakes: [],
    notes: "Perfect execution. Waited for the 5-min candle close below VWAP. Held through the initial pullback."
  },
  {
    id: '2',
    symbol: 'NQ_F',
    entryDate: '2023-10-25 11:00',
    exitDate: '2023-10-25 11:15',
    type: TradeType.LONG,
    setup: 'Pullback Retest',
    entryPrice: 14600.25,
    exitPrice: 14580.00,
    quantity: 1,
    pnl: -405.00,
    rMultiple: -1.0,
    status: TradeStatus.LOSS,
    mistakes: ['Early Entry', 'FOMO'],
    notes: "Jumped in before the confirmation. Should have waited for the retest of 14600 level."
  },
  {
    id: '3',
    symbol: 'AAPL',
    entryDate: '2023-10-26 10:00',
    exitDate: '2023-10-26 14:00',
    type: TradeType.LONG,
    setup: 'Breakout',
    entryPrice: 170.50,
    exitPrice: 173.20,
    quantity: 100,
    pnl: 270.00,
    rMultiple: 1.8,
    status: TradeStatus.WIN,
    mistakes: []
  },
  {
    id: '4',
    symbol: 'EURUSD',
    entryDate: '2023-10-27 03:00',
    exitDate: '2023-10-27 04:30',
    type: TradeType.SHORT,
    setup: 'London Session',
    entryPrice: 1.0560,
    exitPrice: 1.0540,
    quantity: 100000,
    pnl: 200.00,
    rMultiple: 2.0,
    status: TradeStatus.WIN,
    mistakes: []
  },
  {
    id: '5',
    symbol: 'TSLA',
    entryDate: '2023-10-27 09:45',
    exitDate: '2023-10-27 09:50',
    type: TradeType.SHORT,
    setup: 'Gap Fill',
    entryPrice: 210.00,
    exitPrice: 212.00,
    quantity: 50,
    pnl: -100.00,
    rMultiple: -1.0,
    status: TradeStatus.LOSS,
    mistakes: ['Against Trend']
  },
  {
    id: '6',
    symbol: 'GC_F',
    entryDate: '2023-10-28 08:30',
    exitDate: '2023-10-28 12:00',
    type: TradeType.LONG,
    setup: 'Macro',
    entryPrice: 1980.0,
    exitPrice: 1995.0,
    quantity: 1,
    pnl: 1500.00,
    rMultiple: 3.1,
    status: TradeStatus.WIN,
    mistakes: []
  }
];

export const MOCK_DAILY_STATS: DailyStat[] = [
  // September Data
  { date: '2023-09-25', pnl: -150, tradeCount: 1 },
  { date: '2023-09-26', pnl: 450, tradeCount: 2 },
  { date: '2023-09-27', pnl: 890, tradeCount: 3 },
  { date: '2023-09-28', pnl: -200, tradeCount: 1 },
  { date: '2023-09-29', pnl: 1200, tradeCount: 2 },

  // October Data
  { date: '2023-10-01', pnl: 500, tradeCount: 2 },
  { date: '2023-10-02', pnl: -200, tradeCount: 1 },
  { date: '2023-10-03', pnl: 1200, tradeCount: 3 },
  { date: '2023-10-04', pnl: 0, tradeCount: 0 },
  { date: '2023-10-05', pnl: -450, tradeCount: 4 },
  { date: '2023-10-06', pnl: 800, tradeCount: 2 },
  { date: '2023-10-07', pnl: 0, tradeCount: 0 }, // Weekend
  { date: '2023-10-08', pnl: 0, tradeCount: 0 }, // Weekend
  { date: '2023-10-09', pnl: 250, tradeCount: 1 },
  { date: '2023-10-10', pnl: 1500, tradeCount: 2 },
  { date: '2023-10-11', pnl: -100, tradeCount: 1 },
  { date: '2023-10-12', pnl: -800, tradeCount: 5 }, // Tilt day
  { date: '2023-10-13', pnl: 400, tradeCount: 2 },
  { date: '2023-10-25', pnl: 1645, tradeCount: 2 },
  { date: '2023-10-26', pnl: 270, tradeCount: 1 },
  { date: '2023-10-27', pnl: 100, tradeCount: 2 },
  { date: '2023-10-28', pnl: 1500, tradeCount: 1 },

  // November Data
  { date: '2023-11-01', pnl: 300, tradeCount: 1 },
  { date: '2023-11-02', pnl: 750, tradeCount: 2 },
  { date: '2023-11-03', pnl: -120, tradeCount: 1 },
  { date: '2023-11-06', pnl: 2100, tradeCount: 3 },
];

export const MOCK_EQUITY_CURVE = [
  { name: 'Start', value: 50000 },
  { name: 'Week 1', value: 51500 },
  { name: 'Week 2', value: 51800 },
  { name: 'Week 3', value: 51200 },
  { name: 'Week 4', value: 53500 },
  { name: 'Current', value: 55100 },
];

export const MOCK_BACKTEST_SESSIONS: BacktestSession[] = [
  {
    id: 'bt_001',
    name: 'EURUSD 2022 Support/Resistance',
    symbol: 'FX:EURUSD',
    strategy: 'Supply & Demand',
    startDate: '2022-01-01',
    initialBalance: 100000,
    trades: [
       {
        id: '1', symbol: 'EURUSD', entryDate: '2022-01-05 10:00', exitDate: '2022-01-05 14:00',
        type: TradeType.SHORT, setup: 'S/R Flip', entryPrice: 1.1350, exitPrice: 1.1320,
        quantity: 100000, pnl: 300, rMultiple: 2.0, status: TradeStatus.WIN, mistakes: []
       },
       {
        id: '2', symbol: 'EURUSD', entryDate: '2022-01-06 09:00', exitDate: '2022-01-06 09:30',
        type: TradeType.LONG, setup: 'S/R Flip', entryPrice: 1.1300, exitPrice: 1.1290,
        quantity: 100000, pnl: -100, rMultiple: -1.0, status: TradeStatus.LOSS, mistakes: []
       }
    ]
  },
  {
    id: 'bt_002',
    name: 'ES Futures Opening Drive',
    symbol: 'AMEX:SPY',
    strategy: 'Opening Range Breakout',
    startDate: '2023-01-01',
    initialBalance: 50000,
    trades: []
  }
];
