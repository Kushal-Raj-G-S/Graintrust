/**
 * HISTORICAL NCDEX DATA FETCHER
 * 
 * Downloads NCDEX bhavcopy files for the last N days to populate historical price data.
 * This is used for:
 * - Initial database seeding
 * - Filling gaps from missed cron runs
 * - Building price graphs (candlestick/line charts)
 * 
 * Usage:
 *   node scripts/fetch-historical-ncdex.js [days]
 *   node scripts/fetch-historical-ncdex.js 30    # Fetch last 30 days
 */

const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NCDEX_BASE_URL = 'https://www.ncdex.com/bhavcopy';
const DAYS_TO_FETCH = parseInt(process.argv[2]) || 7; // Default: last 7 days

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Format date as DDMMMYY (e.g., 01NOV25)
 */
function formatNCDEXDate(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Get SQL date string (YYYY-MM-DD)
 */
function toSQLDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Download bhavcopy for a specific date
 */
async function downloadBhavcopy(date) {
  const dateStr = formatNCDEXDate(date);
  const url = `${NCDEX_BASE_URL}/bhav_copy_${dateStr}.csv`;
  
  console.log(`📥 Downloading: ${dateStr}...`);
  
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return { success: true, data: response.data, dateStr };
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`   ⚠️  Not available (404) - likely weekend/holiday`);
      return { success: false, reason: 'not_published' };
    }
    throw error;
  }
}

/**
 * Parse CSV and extract commodity prices
 */
function parseBhavcopy(csvData, tradeDate) {
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const commodities = [];

  for (const record of records) {
    try {
      const commodity = {
        commodityCode: record.Commodity || record.COMMODITY || record.commodity,
        commodityName: record.Commodity || record.COMMODITY || record.commodity,
        symbol: record.Symbol || record.SYMBOL || record.symbol,
        openPrice: parseFloat(record.Open || record.OPEN || record.open || 0),
        highPrice: parseFloat(record.High || record.HIGH || record.high || 0),
        lowPrice: parseFloat(record.Low || record.LOW || record.low || 0),
        closePrice: parseFloat(record.Close || record.CLOSE || record.close || 0),
        lastPrice: parseFloat(record.Last || record.LAST || record.last || 0),
        settlePrice: parseFloat(record.Settle || record.SETTLE || record.settle || 0),
        volume: parseInt(record.Volume || record.VOLUME || record.volume || 0),
        openInterest: parseInt(record['Open Interest'] || record['OPEN INTEREST'] || record.OI || 0),
        tradeDate: tradeDate
      };

      if (commodity.commodityCode && commodity.symbol) {
        commodities.push(commodity);
      }
    } catch (err) {
      console.log(`   ⚠️  Skipped invalid record`);
    }
  }

  return commodities;
}

/**
 * Save prices to database
 */
async function savePrices(commodities) {
  if (!commodities || commodities.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const { data, error } = await supabase
    .from('ncdex_prices')
    .upsert(commodities, {
      onConflict: 'commodityCode,symbol,tradeDate',
      ignoreDuplicates: true
    });

  if (error && error.code !== '23505') { // Ignore duplicate errors
    throw error;
  }

  return { inserted: commodities.length, skipped: 0 };
}

/**
 * Main function - fetch historical data
 */
async function main() {
  console.log(`
============================================================
📊 HISTORICAL NCDEX DATA FETCHER
============================================================
`);
  console.log(`📅 Fetching last ${DAYS_TO_FETCH} days of NCDEX data...\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let successfulDays = 0;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - DAYS_TO_FETCH);

  // Iterate through each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const sqlDate = toSQLDate(currentDate);
    
    try {
      // Download bhavcopy
      const result = await downloadBhavcopy(currentDate);
      
      if (!result.success) {
        totalSkipped++;
        continue;
      }

      // Parse CSV
      const commodities = parseBhavcopy(result.data, sqlDate);
      console.log(`   ✅ Parsed ${commodities.length} commodities`);

      // Save to database
      const { inserted } = await savePrices(commodities);
      console.log(`   💾 Saved ${inserted} price records\n`);

      totalInserted += inserted;
      successfulDays++;

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      totalSkipped++;
    }
  }

  // Summary
  console.log(`
============================================================
✅ HISTORICAL FETCH COMPLETE
============================================================
📊 Summary:
   - Days attempted: ${DAYS_TO_FETCH}
   - Successful downloads: ${successfulDays}
   - Total records inserted: ${totalInserted}
   - Days skipped: ${totalSkipped}
   
💡 Use this data to build price graphs and trend analysis!
============================================================
`);

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error(`
============================================================
❌ FATAL ERROR
============================================================
${error.message}
${error.stack}
============================================================
`);
  process.exit(1);
});
