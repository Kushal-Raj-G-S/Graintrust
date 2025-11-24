/**
 * NCDEX Daily Price Updater
 * Fetches latest bhavcopy from NCDEX and updates database
 * Run daily via cron: node --loader ts-node/esm scripts/update-ncdex-prices.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Commodity mapping for NCDEX codes
const COMMODITY_MAP: Record<string, string> = {
  'WHEAT': 'Wheat',
  'RICE': 'Rice',
  'MAIZE': 'Maize',
  'SOYBEAN': 'Soybean',
  'COTTON': 'Cotton',
  'TURMERIC': 'Turmeric',
  'JEERA': 'Jeera (Cumin)',
  'CORIANDER': 'Coriander',
  'CHANA': 'Chickpea (Chana)',
  'GUAR': 'Guar Seed',
  'GUARGUM': 'Guar Gum',
  'CASTOR': 'Castor Seed',
  'RAPESEED': 'Rapeseed',
  'MUSTARD': 'Mustard Seed',
  'PEPPER': 'Black Pepper',
  'CARDAMOM': 'Cardamom',
  'REDCHILLI': 'Red Chilli',
  'SUGARCANE': 'Sugarcane',
  'URAD': 'Black Gram (Urad)',
  'MOONG': 'Green Gram (Moong)'
};

interface NCDEXPrice {
  commodityCode: string;
  commodityName: string;
  symbol: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  lastPrice: number;
  settlePrice: number;
  volume: number;
  openInterest: number;
  tradedValue: number;
  expiryDate: string;
  deliveryCenter: string;
  tradeDate: string;
}

/**
 * Fetch NCDEX bhavcopy for a specific date
 * NCDEX URL format: https://www.ncdex.com/downloads/bhavcopy/csv/BHAVCOPY_DATE.csv
 */
async function fetchNCDEXBhavcopy(date: Date): Promise<NCDEXPrice[]> {
  const dateStr = formatDateForNCDEX(date);
  const url = `https://www.ncdex.com/downloads/bhavcopy/csv/BHAVCOPY_${dateStr}.csv`;
  
  console.log(`📥 Fetching NCDEX bhavcopy: ${url}`);
  
  try {
    const response = await axios.get(url, { timeout: 30000 });
    return parseNCDEXCSV(response.data, date);
  } catch (error) {
    console.error('❌ Failed to fetch NCDEX bhavcopy:', error);
    
    // Try scraping from NCDEX website as fallback
    return await scrapeNCDEXPrices(date);
  }
}

/**
 * Parse NCDEX CSV bhavcopy
 */
function parseNCDEXCSV(csvData: string, tradeDate: Date): NCDEXPrice[] {
  const lines = csvData.trim().split('\n');
  const prices: NCDEXPrice[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 15) continue;
    
    const commodityCode = parts[0]?.trim().toUpperCase();
    if (!commodityCode || !COMMODITY_MAP[commodityCode]) continue;
    
    prices.push({
      commodityCode,
      commodityName: COMMODITY_MAP[commodityCode],
      symbol: parts[1]?.trim() || `${commodityCode}-${parts[10]?.trim()}`,
      openPrice: parseFloat(parts[3]) || 0,
      highPrice: parseFloat(parts[4]) || 0,
      lowPrice: parseFloat(parts[5]) || 0,
      closePrice: parseFloat(parts[6]) || 0,
      lastPrice: parseFloat(parts[7]) || 0,
      settlePrice: parseFloat(parts[8]) || 0,
      volume: parseInt(parts[11]) || 0,
      openInterest: parseInt(parts[12]) || 0,
      tradedValue: parseFloat(parts[13]) || 0,
      expiryDate: parts[10]?.trim() || '',
      deliveryCenter: parts[14]?.trim() || '',
      tradeDate: tradeDate.toISOString().split('T')[0]
    });
  }
  
  return prices;
}

/**
 * Scrape NCDEX prices from website (fallback)
 */
async function scrapeNCDEXPrices(date: Date): Promise<NCDEXPrice[]> {
  console.log('🕷️ Scraping NCDEX website for prices...');
  
  try {
    const response = await axios.get('https://www.ncdex.com/market-data/live-market-watch', {
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const prices: NCDEXPrice[] = [];
    const tradeDate = date.toISOString().split('T')[0];
    
    // Parse market watch table (structure may vary)
    $('table.market-watch tr').each((i, row) => {
      if (i === 0) return; // Skip header
      
      const cols = $(row).find('td');
      if (cols.length < 8) return;
      
      const symbol = $(cols[0]).text().trim();
      const commodityCode = symbol.split('-')[0]?.toUpperCase();
      
      if (!commodityCode || !COMMODITY_MAP[commodityCode]) return;
      
      prices.push({
        commodityCode,
        commodityName: COMMODITY_MAP[commodityCode],
        symbol,
        openPrice: parseFloat($(cols[2]).text()) || 0,
        highPrice: parseFloat($(cols[3]).text()) || 0,
        lowPrice: parseFloat($(cols[4]).text()) || 0,
        closePrice: parseFloat($(cols[5]).text()) || 0,
        lastPrice: parseFloat($(cols[6]).text()) || 0,
        settlePrice: parseFloat($(cols[7]).text()) || 0,
        volume: 0,
        openInterest: 0,
        tradedValue: 0,
        expiryDate: '',
        deliveryCenter: '',
        tradeDate
      });
    });
    
    return prices;
  } catch (error) {
    console.error('❌ Failed to scrape NCDEX prices:', error);
    return [];
  }
}

/**
 * Format date for NCDEX API (DDMMYYYY)
 */
function formatDateForNCDEX(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Update database with new prices
 */
async function updateDatabase(prices: NCDEXPrice[]): Promise<void> {
  if (prices.length === 0) {
    console.log('⚠️ No prices to update');
    return;
  }
  
  console.log(`💾 Updating ${prices.length} commodity prices...`);
  
  const { data, error } = await supabase
    .from('ncdex_prices')
    .upsert(prices, {
      onConflict: 'commodityCode,symbol,tradeDate',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('❌ Database update failed:', error);
    throw error;
  }
  
  console.log('✅ Database updated successfully!');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 NCDEX Price Updater Started');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  try {
    // Get yesterday's date (NCDEX publishes previous day data)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Fetch prices
    const prices = await fetchNCDEXBhavcopy(yesterday);
    
    if (prices.length === 0) {
      console.log('⚠️ No prices fetched, trying today\'s date...');
      const today = new Date();
      const todayPrices = await fetchNCDEXBhavcopy(today);
      
      if (todayPrices.length > 0) {
        await updateDatabase(todayPrices);
      } else {
        console.log('❌ No prices available for today either');
      }
    } else {
      await updateDatabase(prices);
    }
    
    console.log('✅ NCDEX Price Update Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { fetchNCDEXBhavcopy, updateDatabase };
