import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validation: Check for a custom API Key header to secure the endpoint
    const apiKey = req.headers.get('x-api-key')
    const serviceApiKey = Deno.env.get('SYNC_API_KEY')

    if (!serviceApiKey || apiKey !== serviceApiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse Payload from MT5
    const { 
      user_id,
      symbol, 
      profit, 
      volume, 
      entry_time, 
      exit_time, 
      type, // 'Buy' or 'Sell'
      ticket 
    } = await req.json()

    if (!user_id || !symbol || !ticket) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Map MT5 data to your DB Schema
    // Note: MT5 sends timestamps as Unix integers (seconds). JS/Postgres needs ISO or milliseconds.
    const tradeData = {
      user_id: user_id,
      symbol: symbol,
      type: type === 0 ? 'LONG' : 'SHORT', // MT5: 0=Buy, 1=Sell
      entry_date: new Date(entry_time * 1000).toISOString(),
      exit_date: new Date(exit_time * 1000).toISOString(),
      entry_price: 0, // You might want to add this to the payload from MT5 if needed
      exit_price: 0,  // You might want to add this to the payload from MT5 if needed
      quantity: volume,
      pnl: profit,
      status: profit >= 0 ? 'WIN' : 'LOSS',
      setup: 'MT5 Bot', // Default setup tag
      notes: `Ticket #${ticket} synced from MT5`,
      r_multiple: 0, // Placeholder
    }

    // 4. Insert into Supabase
    // Using upsert based on a unique identifier logic if you store tickets, 
    // otherwise simple insert.
    const { data, error } = await supabaseClient
      .from('trades')
      .insert(tradeData)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})