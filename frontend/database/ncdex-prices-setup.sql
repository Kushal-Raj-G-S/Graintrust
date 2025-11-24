-- NCDEX Market Prices Table
-- Stores daily commodity prices from NCDEX bhavcopy

CREATE TABLE IF NOT EXISTS ncdex_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Commodity Information
  "commodityCode" TEXT NOT NULL,
  "commodityName" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  
  -- Price Data
  "openPrice" DECIMAL(10, 2),
  "highPrice" DECIMAL(10, 2),
  "lowPrice" DECIMAL(10, 2),
  "closePrice" DECIMAL(10, 2),
  "lastPrice" DECIMAL(10, 2),
  "settlePrice" DECIMAL(10, 2),
  
  -- Volume & Trading
  "volume" BIGINT,
  "openInterest" BIGINT,
  "tradedValue" DECIMAL(15, 2),
  
  -- Contract Details
  "expiryDate" DATE,
  "deliveryCenter" TEXT,
  
  -- Metadata
  "tradeDate" DATE NOT NULL,
  "fetchedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_commodity_trade_date UNIQUE ("commodityCode", "symbol", "tradeDate")
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ncdex_prices_commodity ON ncdex_prices("commodityCode");
CREATE INDEX IF NOT EXISTS idx_ncdex_prices_trade_date ON ncdex_prices("tradeDate" DESC);
CREATE INDEX IF NOT EXISTS idx_ncdex_prices_commodity_date ON ncdex_prices("commodityCode", "tradeDate" DESC);
CREATE INDEX IF NOT EXISTS idx_ncdex_prices_symbol ON ncdex_prices("symbol");

-- RLS Policies (public read for transparency)
ALTER TABLE ncdex_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view NCDEX prices" ON ncdex_prices
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert NCDEX prices" ON ncdex_prices
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Comments
COMMENT ON TABLE ncdex_prices IS 'Daily commodity prices from NCDEX bhavcopy CSV';
COMMENT ON COLUMN ncdex_prices."commodityCode" IS 'NCDEX commodity code (e.g., WHEAT, RICE)';
COMMENT ON COLUMN ncdex_prices."symbol" IS 'Trading symbol with expiry (e.g., WHEAT25NOV)';
COMMENT ON COLUMN ncdex_prices."tradeDate" IS 'Date of trading session';
COMMENT ON COLUMN ncdex_prices."closePrice" IS 'Closing price in INR per unit';
