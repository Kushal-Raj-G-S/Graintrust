/**
 * MARKET PRICE HISTORY API
 * 
 * Returns historical price data for building graphs/charts.
 * Supports filtering by commodity and date range.
 * 
 * Query Parameters:
 *   - commodity: Filter by commodity code (e.g., WHEAT, RICE)
 *   - days: Number of days to fetch (default: 30)
 *   - symbol: Specific contract symbol (optional)
 * 
 * Response Format:
 *   {
 *     success: true,
 *     commodity: "WHEAT",
 *     days: 30,
 *     count: 150,
 *     priceHistory: [
 *       {
 *         date: "2025-11-01",
 *         open: 2450.50,
 *         high: 2480.00,
 *         low: 2440.00,
 *         close: 2475.00,
 *         volume: 125000,
 *         openInterest: 45000
 *       },
 *       ...
 *     ]
 *   }
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
    const days = parseInt(searchParams.get('days') || '30');
    const symbol = searchParams.get('symbol');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Build query
    let query = supabase
      .from('ncdex_prices')
      .select('*')
      .gte('tradeDate', startDate.toISOString().split('T')[0])
      .lte('tradeDate', endDate.toISOString().split('T')[0])
      .order('tradeDate', { ascending: true });

    // Apply filters
    if (commodity) {
      query = query.eq('commodityCode', commodity.toUpperCase());
    }
    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    const { data: prices, error } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Format data for charting
    const priceHistory = prices?.map(price => ({
      date: price.tradeDate,
      open: parseFloat(price.openPrice || 0),
      high: parseFloat(price.highPrice || 0),
      low: parseFloat(price.lowPrice || 0),
      close: parseFloat(price.closePrice || 0),
      volume: parseInt(price.volume || 0),
      openInterest: parseInt(price.openInterest || 0),
      symbol: price.symbol,
      commodityName: price.commodityName
    })) || [];

    // Group by date if multiple contracts
    const dailyPrices = new Map();
    priceHistory.forEach(price => {
      if (!dailyPrices.has(price.date)) {
        dailyPrices.set(price.date, price);
      } else {
        // If multiple contracts, use the one with highest volume
        const existing = dailyPrices.get(price.date);
        if (price.volume > existing.volume) {
          dailyPrices.set(price.date, price);
        }
      }
    });

    const consolidatedHistory = Array.from(dailyPrices.values());

    return NextResponse.json({
      success: true,
      commodity: commodity || 'ALL',
      days,
      count: consolidatedHistory.length,
      priceHistory: consolidatedHistory,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
