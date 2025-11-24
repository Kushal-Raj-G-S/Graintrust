/**
 * NCDEX MARKET PRICE FETCHER
 * 
 * Automatically downloads daily NCDEX bhavcopy CSV, parses commodity prices,
 * and updates the database. Runs daily at 6:30 AM IST via cron job.
 * 
 * Usage:
 *   node scripts/fetch-ncdex-prices.js
 * 
 * Cron setup (6:30 AM IST daily):
 *   30 1 * * * cd /path/to/project && node scripts/fetch-ncdex-prices.js >> logs/ncdex.log 2>&1
 */

const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access
const NCDEX_BASE_URL = 'https://www.ncdex.com/bhavcopy';

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generate today's date in DDMMMYY format (e.g., 02NOV25)
 * NCDEX uses this format for their bhavcopy CSV files
 */
function getTodayDateFormat() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = monthNames[now.getMonth()];
  const year = String(now.getFullYear()).slice(-2);
  
  return `${day}${month}${year}`;
}

/**
 * Build NCDEX bhavcopy URL for given date
 */
function buildNCDEXUrl(dateStr) {
  return `${NCDEX_BASE_URL}/bhav_copy_${dateStr}.csv`;
}

/**
 * Download CSV file from NCDEX
 */
async function downloadBhavcopy(url) {
  console.log(`📥 Downloading bhavcopy from: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✅ Downloaded successfully (${response.data.length} bytes)`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`❌ Bhavcopy not found for this date. NCDEX may not have published it yet.`);
    }
    throw new Error(`❌ Download failed: ${error.message}`);
  }
}

/**
 * Parse CSV data and extract commodity prices
 */
function parseBhavcopy(csvData) {
  console.log(`📊 Parsing CSV data...`);
  
  try {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`✅ Parsed ${records.length} records`);
    return records;
  } catch (error) {
    throw new Error(`❌ CSV parsing failed: ${error.message}`);
  }
}

/**
 * Extract unique commodities and their latest prices
 */
function extractCommodityPrices(records, tradeDate) {
  console.log(`🔍 Extracting commodity prices...`);
  
  const commodities = [];
  
  for (const record of records) {
    try {
      // NCDEX CSV columns (may vary - adjust as needed)
      const commodity = {
        commodityCode: record['Commodity'] || record['COMMODITY'],
        commodityName: record['Commodity'] || record['COMMODITY'],
        symbol: record['Symbol'] || record['SYMBOL'],
        openPrice: parseFloat(record['Open'] || record['OPEN']) || null,
        highPrice: parseFloat(record['High'] || record['HIGH']) || null,
        lowPrice: parseFloat(record['Low'] || record['LOW']) || null,
        closePrice: parseFloat(record['Close'] || record['CLOSE']) || null,
        lastPrice: parseFloat(record['Last'] || record['LAST']) || null,
        settlePrice: parseFloat(record['Settle Price'] || record['SETTLE_PRICE']) || null,
        volume: parseInt(record['Volume'] || record['VOLUME']) || null,
        openInterest: parseInt(record['Open Interest'] || record['OPEN_INTEREST']) || null,
        tradedValue: parseFloat(record['Value'] || record['VALUE']) || null,
        expiryDate: record['Expiry'] || record['EXPIRY'] || null,
        deliveryCenter: record['Delivery Center'] || record['DELIVERY_CENTER'] || null,
        tradeDate: tradeDate
      };
      
      // Skip if essential data is missing
      if (!commodity.commodityCode || !commodity.symbol) {
        continue;
      }
      
      commodities.push(commodity);
    } catch (error) {
      console.warn(`⚠️ Skipping record due to parsing error:`, error.message);
      continue;
    }
  }
  
  console.log(`✅ Extracted ${commodities.length} commodity prices`);
  return commodities;
}

/**
 * Save commodity prices to Supabase database
 */
async function savePricesToDatabase(commodities) {
  console.log(`💾 Saving ${commodities.length} prices to database...`);
  
  if (commodities.length === 0) {
    console.log(`⚠️ No commodities to save`);
    return { inserted: 0, updated: 0, errors: 0 };
  }
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  // Use upsert to handle duplicates (insert or update)
  for (const commodity of commodities) {
    try {
      const { error } = await supabase
        .from('ncdex_prices')
        .upsert(commodity, {
          onConflict: 'commodityCode,symbol,tradeDate',
          ignoreDuplicates: false // Update if exists
        });
      
      if (error) {
        console.error(`❌ Error saving ${commodity.symbol}:`, error.message);
        errors++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error(`❌ Error saving ${commodity.symbol}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Database update complete: ${inserted} inserted/updated, ${errors} errors`);
  return { inserted, updated, errors };
}

/**
 * Save a backup copy of the CSV locally
 */
function saveBackup(csvData, dateStr) {
  const backupDir = path.join(__dirname, '../data/ncdex-backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `bhav_copy_${dateStr}.csv`);
  fs.writeFileSync(backupFile, csvData);
  
  console.log(`💾 Backup saved: ${backupFile}`);
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 NCDEX Price Fetcher Started`);
  console.log(`📅 Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Step 1: Generate today's date format
    const dateStr = getTodayDateFormat();
    const tradeDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`📅 Fetching bhavcopy for: ${dateStr} (${tradeDate})`);
    
    // Step 2: Download CSV
    const url = buildNCDEXUrl(dateStr);
    const csvData = await downloadBhavcopy(url);
    
    // Step 3: Save backup
    saveBackup(csvData, dateStr);
    
    // Step 4: Parse CSV
    const records = parseBhavcopy(csvData);
    
    // Step 5: Extract commodity prices
    const commodities = extractCommodityPrices(records, tradeDate);
    
    // Step 6: Save to database
    const result = await savePricesToDatabase(commodities);
    
    // Step 7: Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SUCCESS - NCDEX Price Fetch Complete`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   - Records processed: ${records.length}`);
    console.log(`   - Commodities extracted: ${commodities.length}`);
    console.log(`   - Database inserts/updates: ${result.inserted}`);
    console.log(`   - Errors: ${result.errors}`);
    console.log(`   - Time taken: ${elapsed}s`);
    console.log(`${'='.repeat(60)}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ FAILED - NCDEX Price Fetch Error`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`${'='.repeat(60)}\n`);
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, getTodayDateFormat, buildNCDEXUrl };
