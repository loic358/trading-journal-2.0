
import { supabase } from './supabase';
import { Trade, TradeType, TradeStatus } from '../types';

// Map DB snake_case to App camelCase
const mapFromDB = (data: any): Trade => ({
  id: data.id,
  symbol: data.symbol,
  entryDate: data.entry_date,
  exitDate: data.exit_date,
  type: data.type as TradeType,
  setup: data.setup,
  entryPrice: Number(data.entry_price),
  exitPrice: Number(data.exit_price),
  stopLoss: data.stop_loss ? Number(data.stop_loss) : undefined,
  quantity: Number(data.quantity),
  pnl: Number(data.pnl),
  rMultiple: Number(data.r_multiple),
  status: data.status as TradeStatus,
  mistakes: data.mistakes || [],
  notes: data.notes,
  screenshotUrl: data.screenshot_url
});

// Map App camelCase to DB snake_case
const mapToDB = (trade: Partial<Trade>, userId: string) => ({
  user_id: userId,
  symbol: trade.symbol,
  entry_date: trade.entryDate,
  exit_date: trade.exitDate,
  type: trade.type,
  setup: trade.setup,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  stop_loss: trade.stopLoss,
  quantity: trade.quantity,
  pnl: trade.pnl,
  r_multiple: trade.rMultiple,
  status: trade.status,
  mistakes: trade.mistakes,
  notes: trade.notes,
  screenshot_url: trade.screenshotUrl
});

export const tradeService = {
  async fetchTrades() {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('entry_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapFromDB);
  },

  async createTrade(trade: Partial<Trade>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const dbPayload = mapToDB(trade, user.id);
    const { data, error } = await supabase
      .from('trades')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return mapFromDB(data);
  },

  async updateTrade(trade: Trade) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Remove ID and other non-updatable fields if needed, but ID is needed for selector
    const dbPayload = mapToDB(trade, user.id);
    
    const { data, error } = await supabase
      .from('trades')
      .update(dbPayload)
      .eq('id', trade.id)
      .select()
      .single();

    if (error) throw error;
    return mapFromDB(data);
  },

  async deleteTrade(id: string) {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
