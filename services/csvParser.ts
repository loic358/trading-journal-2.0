import { Trade, TradeType, TradeStatus } from '../types';

export interface ImportResult {
  success: boolean;
  trades: Trade[];
  errors: string[];
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
  };
}

// Helper to clean CSV lines (handle quotes, etc.)
const splitCSVLine = (line: string): string[] => {
  const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : line.split(',').map(s => s.trim());
};

// Helper to normalize dates to YYYY-MM-DD HH:mm
const parseDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().slice(0, 16).replace('T', ' ');
  
  // Try standard timestamp first
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }

  // Handle MetaTrader format (YYYY.MM.DD HH:mm)
  if (dateStr.includes('.')) {
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('.');
    const timePart = parts[1] || '00:00';
    return `${dateParts[0]}-${dateParts[1]}-${dateParts[2]} ${timePart.substring(0, 5)}`;
  }

  return dateStr; // Return original if parsing fails (fallback)
};

const detectBrokerFormat = (headerRow: string[]): 'METATRADER' | 'TRADINGVIEW' | 'NINJATRADER' | 'UNKNOWN' => {
  const headerString = headerRow.join(',').toLowerCase();
  
  if (headerString.includes('ticket') && headerString.includes('open time')) return 'METATRADER';
  if (headerString.includes('instrument') && headerString.includes('market pos')) return 'NINJATRADER';
  if (headerString.includes('date/time') && headerString.includes('profit')) return 'TRADINGVIEW';
  
  return 'UNKNOWN';
};

export const parseBrokerCSV = (csvContent: string): ImportResult => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const result: ImportResult = {
    success: false,
    trades: [],
    errors: [],
    summary: { totalProcessed: 0, successful: 0, failed: 0 }
  };

  if (lines.length < 2) {
    result.errors.push("CSV file is empty or missing headers.");
    return result;
  }

  const headerRow = splitCSVLine(lines[0]);
  const format = detectBrokerFormat(headerRow);

  if (format === 'UNKNOWN') {
    result.errors.push("Could not detect broker format. Ensure headers match standard MT4, TradingView, or NinjaTrader exports.");
    return result;
  }

  // Find column indices based on format
  const headers = headerRow.map(h => h.toLowerCase());
  
  // Logic to parse specific formats
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columns = splitCSVLine(line);
    
    // Skip empty lines or footer lines common in exports
    if (columns.length < 5) continue; 

    result.summary.totalProcessed++;

    try {
      let trade: Partial<Trade> = {
        id: `imp_${Date.now()}_${i}`,
        mistakes: [],
        status: TradeStatus.OPEN
      };

      if (format === 'METATRADER') {
        // MT4: Ticket, Open Time, Type, Size, Item, Price, S / L, T / P, Close Time, Price, Commission, Taxes, Swap, Profit
        const typeIdx = headers.indexOf('type');
        const typeStr = columns[typeIdx].toLowerCase();
        
        // Skip balance transactions
        if (!typeStr.includes('buy') && !typeStr.includes('sell')) continue;

        trade.entryDate = parseDate(columns[headers.indexOf('open time')]);
        trade.exitDate = parseDate(columns[headers.indexOf('close time')]);
        trade.symbol = columns[headers.indexOf('item')];
        trade.type = typeStr.includes('buy') ? TradeType.LONG : TradeType.SHORT;
        trade.entryPrice = parseFloat(columns[headers.indexOf('open price')]);
        trade.exitPrice = parseFloat(columns[headers.indexOf('close price')] || columns[headers.lastIndexOf('price')]); // MT4 sometimes has 2 price columns named 'Price'
        trade.quantity = parseFloat(columns[headers.indexOf('size')]);
        trade.pnl = parseFloat(columns[headers.indexOf('profit')]);
      } 
      else if (format === 'TRADINGVIEW') {
        // TV: Type, Symbol, Date/Time, Price, Contracts, Profit, ...
        const typeStr = columns[headers.indexOf('type')].toLowerCase();
        trade.entryDate = parseDate(columns[headers.indexOf('date/time')]);
        trade.exitDate = trade.entryDate; // TV sometimes only exports exit time for closed trades list
        trade.symbol = columns[headers.indexOf('symbol')];
        trade.type = typeStr.includes('short') ? TradeType.SHORT : TradeType.LONG;
        trade.entryPrice = parseFloat(columns[headers.indexOf('price')]);
        trade.exitPrice = parseFloat(columns[headers.indexOf('price')]); // Fallback
        trade.quantity = parseFloat(columns[headers.indexOf('contracts')] || columns[headers.indexOf('quantity')] || '1');
        trade.pnl = parseFloat(columns[headers.indexOf('profit')] || '0');
      }
      else if (format === 'NINJATRADER') {
        // NT: Instrument, Market pos., Qty, Entry price, Exit price, Entry time, Exit time, PnL, ...
        const posStr = columns[headers.indexOf('market pos.')].toLowerCase();
        trade.symbol = columns[headers.indexOf('instrument')];
        trade.type = posStr.includes('long') ? TradeType.LONG : TradeType.SHORT;
        trade.quantity = parseFloat(columns[headers.indexOf('qty')]);
        trade.entryPrice = parseFloat(columns[headers.indexOf('entry price')]);
        trade.exitPrice = parseFloat(columns[headers.indexOf('exit price')]);
        trade.entryDate = parseDate(columns[headers.indexOf('entry time')]);
        trade.exitDate = parseDate(columns[headers.indexOf('exit time')]);
        trade.pnl = parseFloat(columns[headers.indexOf('pnl')]);
      }

      // Derived fields
      if (trade.pnl !== undefined) {
        trade.status = trade.pnl > 0 ? TradeStatus.WIN : (trade.pnl < 0 ? TradeStatus.LOSS : TradeStatus.BE);
      }
      
      // Calculate basic R multiple if not present (simple calculation)
      // Assuming risk is roughly equal to average loss or 1% (mock logic for import)
      if (trade.pnl !== undefined) {
         trade.rMultiple = parseFloat((trade.pnl / 100).toFixed(2)); // Mock R calculation relative to $100 risk unit
      } else {
         trade.rMultiple = 0;
      }
      
      trade.setup = 'Imported'; // Default setup

      // Validation
      if (!trade.symbol || isNaN(trade.pnl || 0)) {
        throw new Error("Missing required fields (Symbol or PnL)");
      }

      result.trades.push(trade as Trade);
      result.summary.successful++;

    } catch (err: any) {
      result.summary.failed++;
      result.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  result.success = result.trades.length > 0;
  return result;
};