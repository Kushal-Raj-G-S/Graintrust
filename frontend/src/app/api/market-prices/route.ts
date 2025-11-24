/**
 * API Endpoint: Get Latest NCDEX Market Prices
 * 
 * Returns current commodity prices from NCDEX
 * GET /api/market-prices
 * GET /api/market-prices?commodity=WHEAT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('ncdex_prices')
      .select('*')
      .order('tradeDate', { ascending: false })
      .order('fetchedAt', { ascending: false });
    
    // Filter by commodity if specified
    if (commodity) {
      query = query.eq('commodityCode', commodity.toUpperCase());
    }
    
    query = query.limit(limit);
    
    const { data: prices, error } = await query;
    
    if (error) {
      console.error('Error fetching NCDEX prices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch market prices' },
        { status: 500 }
      );
    }
    
    // Group by commodity for latest prices
    const latestPrices = new Map();
    for (const price of prices || []) {
      if (!latestPrices.has(price.commodityCode)) {
        latestPrices.set(price.commodityCode, price);
      }
    }
    
    return NextResponse.json({
      success: true,
      count: latestPrices.size,
      latestPrices: Array.from(latestPrices.values()),
      allPrices: prices
    });
    
  } catch (error) {
    console.error('Error in market prices API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
