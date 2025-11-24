/**
 * GENERATE DEMO NCDEX DATA
 * 
 * Creates realistic demo price data for hackathon presentation.
 * This simulates actual NCDEX bhavcopy data with realistic price movements.
 * 
 * Usage:
 *   node scripts/generate-demo-ncdex-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Commodity configurations with realistic base prices (INR per quintal)
const COMMODITIES = [
  // Grains
  { code: 'WHEAT', name: 'Wheat', basePrice: 2450, volatility: 0.02 },
  { code: 'RICE', name: 'Rice', basePrice: 3200, volatility: 0.015 },
  { code: 'MAIZE', name: 'Maize', basePrice: 1850, volatility: 0.018 },
  { code: 'BARLEY', name: 'Barley', basePrice: 1950, volatility: 0.02 },
  
  // Pulses
  { code: 'SOYBEAN', name: 'Soybean', basePrice: 4200, volatility: 0.02 },
  { code: 'CHICKPEA', name: 'Chickpea (Chana)', basePrice: 5500, volatility: 0.025 },
  { code: 'URAD', name: 'Black Gram (Urad)', basePrice: 6200, volatility: 0.03 },
  { code: 'MOONG', name: 'Green Gram (Moong)', basePrice: 7800, volatility: 0.028 },
  
  // Cash Crops
  { code: 'COTTON', name: 'Cotton', basePrice: 5800, volatility: 0.025 },
  { code: 'SUGARCANE', name: 'Sugarcane', basePrice: 3500, volatility: 0.015 },
  { code: 'GROUNDNUT', name: 'Groundnut', basePrice: 5400, volatility: 0.022 },
  
  // Spices
  { code: 'TURMERIC', name: 'Turmeric', basePrice: 8500, volatility: 0.03 },
  { code: 'JEERA', name: 'Jeera (Cumin)', basePrice: 25000, volatility: 0.04 },
  { code: 'CORIANDER', name: 'Coriander', basePrice: 7200, volatility: 0.025 },
  { code: 'CHILLI', name: 'Red Chilli', basePrice: 12000, volatility: 0.035 },
  { code: 'CARDAMOM', name: 'Cardamom', basePrice: 145000, volatility: 0.05 },
  { code: 'BLACKPEPPER', name: 'Black Pepper', basePrice: 48000, volatility: 0.045 },
  
  // Oilseeds
  { code: 'MUSTARD', name: 'Mustard Seed', basePrice: 5200, volatility: 0.024 },
  { code: 'RAPESEED', name: 'Rapeseed', basePrice: 5100, volatility: 0.023 },
  { code: 'CASTOR', name: 'Castor Seed', basePrice: 6800, volatility: 0.027 }
];

// Generate price for a specific day with realistic OHLC pattern
function generateDayPrice(commodity, dayIndex, previousClose) {
  const trend = Math.sin(dayIndex / 10) * 0.005; // Gentle trend
  const random = (Math.random() - 0.5) * commodity.volatility;
  
  const open = previousClose * (1 + random);
  const close = open * (1 + trend + random);
  
  const high = Math.max(open, close) * (1 + Math.random() * commodity.volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * commodity.volatility * 0.5);
  const last = close * (1 + (Math.random() - 0.5) * 0.001);
  const settle = (high + low + close + last) / 4;
  
  // Volume varies realistically
  const baseVolume = 100000 + Math.random() * 150000;
  const volume = Math.floor(baseVolume * (1 + Math.sin(dayIndex / 7) * 0.3));
  const openInterest = Math.floor(volume * (0.3 + Math.random() * 0.4));
  
  return {
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
    last: parseFloat(last.toFixed(2)),
    settle: parseFloat(settle.toFixed(2)),
    volume,
    openInterest
  };
}

// Generate date in YYYY-MM-DD format
function toSQLDate(date) {
  return date.toISOString().split('T')[0];
}

// Main function
async function generateDemoData() {
  console.log(`
============================================================
📊 DEMO NCDEX DATA GENERATOR
============================================================
`);

  const daysToGenerate = 90; // 3 months of data
  const allPrices = [];
  
  // Generate data for each commodity
  for (const commodity of COMMODITIES) {
    console.log(`📈 Generating ${daysToGenerate} days for ${commodity.name}...`);
    
    let previousClose = commodity.basePrice;
    const endDate = new Date();
    
    for (let i = daysToGenerate; i >= 0; i--) {
      const tradeDate = new Date();
      tradeDate.setDate(endDate.getDate() - i);
      
      // Skip Sundays (NCDEX closed)
      if (tradeDate.getDay() === 0) continue;
      
      const prices = generateDayPrice(commodity, daysToGenerate - i, previousClose);
      previousClose = prices.close;
      
      // Generate contract symbols (e.g., WHEAT25NOV, WHEAT25DEC)
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const futureDate = new Date(tradeDate);
      futureDate.setMonth(futureDate.getMonth() + 1);
      const symbol = `${commodity.code}${String(futureDate.getFullYear()).slice(-2)}${monthNames[futureDate.getMonth()]}`;
      
      allPrices.push({
        commodityCode: commodity.code,
        commodityName: commodity.name,
        symbol: symbol,
        openPrice: prices.open,
        highPrice: prices.high,
        lowPrice: prices.low,
        closePrice: prices.close,
        lastPrice: prices.last,
        settlePrice: prices.settle,
        volume: prices.volume,
        openInterest: prices.openInterest,
        tradedValue: parseFloat((prices.close * prices.volume / 100).toFixed(2)),
        expiryDate: futureDate.toISOString().split('T')[0],
        deliveryCenter: 'Multiple',
        tradeDate: toSQLDate(tradeDate)
      });
    }
  }

  console.log(`\n💾 Saving ${allPrices.length} price records to database...`);

  // Insert in batches of 500
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < allPrices.length; i += batchSize) {
    const batch = allPrices.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('ncdex_prices')
      .upsert(batch, {
        onConflict: 'commodityCode,symbol,tradeDate',
        ignoreDuplicates: false
      });

    if (error && error.code !== '23505') {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${inserted}/${allPrices.length} (${Math.round(inserted / allPrices.length * 100)}%)`);
    }
  }

  console.log(`\n
============================================================
✅ DEMO DATA GENERATION COMPLETE
============================================================
📊 Summary:
   - Commodities: ${COMMODITIES.length}
   - Days per commodity: ~${daysToGenerate} (excluding Sundays)
   - Total records inserted: ${inserted}
   - Date range: Last ${daysToGenerate} days
   
🎯 Your price graphs are now ready for the hackathon demo!
   
Next steps:
1. Start dev server: npm run dev
2. View graphs: Add <MarketPriceChart /> to your dashboard
3. Test API: curl http://localhost:3000/api/market-prices/history?commodity=WHEAT&days=30

💡 This is DEMO data for presentation. Replace with real NCDEX data after hackathon!
============================================================
`);

  process.exit(0);
}

// Run
generateDemoData().catch(error => {
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
