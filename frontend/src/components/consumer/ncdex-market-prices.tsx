'use client';

/**
 * ADVANCED MARKET PRICES - REAL NCDEX INTEGRATION
 * 
 * Displays professional market price dashboard with REAL NCDEX data
 * Integrates with your existing beautiful UI design
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Volume2,
  RefreshCw,
  Info,
  CheckCircle,
  Store,
  CandlestickChart
} from 'lucide-react';

interface NCDEXPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest: number;
  symbol: string;
  commodityName: string;
}

interface MarketStats {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

export function AdvancedMarketPrices() {
  const [selectedCommodity, setSelectedCommodity] = useState('WHEAT');
  const [days, setDays] = useState(30);
  const [priceHistory, setPriceHistory] = useState<NCDEXPrice[]>([]);
  const [latestPrices, setLatestPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const commodities = [
    // Grains
    { code: 'WHEAT', name: 'Wheat', emoji: '🌾', unit: '/quintal', category: 'Grains' },
    { code: 'RICE', name: 'Rice', emoji: '🍚', unit: '/quintal', category: 'Grains' },
    { code: 'MAIZE', name: 'Maize', emoji: '🌽', unit: '/quintal', category: 'Grains' },
    { code: 'BARLEY', name: 'Barley', emoji: '�', unit: '/quintal', category: 'Grains' },
    
    // Pulses
    { code: 'SOYBEAN', name: 'Soybean', emoji: '🫘', unit: '/quintal', category: 'Pulses' },
    { code: 'CHICKPEA', name: 'Chickpea', emoji: '🟤', unit: '/quintal', category: 'Pulses' },
    { code: 'URAD', name: 'Black Gram', emoji: '⚫', unit: '/quintal', category: 'Pulses' },
    { code: 'MOONG', name: 'Green Gram', emoji: '🟢', unit: '/quintal', category: 'Pulses' },
    
    // Cash Crops
    { code: 'COTTON', name: 'Cotton', emoji: '🌱', unit: '/quintal', category: 'Cash Crops' },
    { code: 'SUGARCANE', name: 'Sugarcane', emoji: '�', unit: '/quintal', category: 'Cash Crops' },
    { code: 'GROUNDNUT', name: 'Groundnut', emoji: '🥜', unit: '/quintal', category: 'Cash Crops' },
    
    // Spices
    { code: 'TURMERIC', name: 'Turmeric', emoji: '🟡', unit: '/quintal', category: 'Spices' },
    { code: 'JEERA', name: 'Cumin', emoji: '🫚', unit: '/quintal', category: 'Spices' },
    { code: 'CORIANDER', name: 'Coriander', emoji: '🌿', unit: '/quintal', category: 'Spices' },
    { code: 'CHILLI', name: 'Red Chilli', emoji: '🌶️', unit: '/quintal', category: 'Spices' },
    { code: 'CARDAMOM', name: 'Cardamom', emoji: '�', unit: '/quintal', category: 'Spices' },
    { code: 'BLACKPEPPER', name: 'Black Pepper', emoji: '⚫', unit: '/quintal', category: 'Spices' },
    
    // Oilseeds
    { code: 'MUSTARD', name: 'Mustard', emoji: '�🟡', unit: '/quintal', category: 'Oilseeds' },
    { code: 'RAPESEED', name: 'Rapeseed', emoji: '🟨', unit: '/quintal', category: 'Oilseeds' },
    { code: 'CASTOR', name: 'Castor', emoji: '🌰', unit: '/quintal', category: 'Oilseeds' },
  ];

  // Fetch latest prices for all commodities
  const fetchLatestPrices = async () => {
    try {
      const response = await fetch('/api/market-prices');
      const data = await response.json();
      if (data.success) {
        setLatestPrices(data.latestPrices || []);
      }
    } catch (error) {
      console.error('Failed to fetch latest prices:', error);
    }
  };

  // Fetch historical data for selected commodity
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/market-prices/history?commodity=${selectedCommodity}&days=${days}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPriceHistory(data.priceHistory || []);
        setLastUpdate(new Date().toLocaleString('en-IN'));
      }
    } catch (error) {
      console.error('Failed to fetch price history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestPrices();
    fetchHistory();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchLatestPrices();
      fetchHistory();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedCommodity, days]);

  // Calculate statistics
  const getStats = (): MarketStats => {
    if (priceHistory.length === 0) {
      return { current: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0 };
    }

    const latest = priceHistory[priceHistory.length - 1];
    const oldest = priceHistory[0];
    const change = latest.close - oldest.close;
    const changePercent = (change / oldest.close) * 100;
    
    const high = Math.max(...priceHistory.map(p => p.high));
    const low = Math.min(...priceHistory.map(p => p.low));
    const totalVolume = priceHistory.reduce((sum, p) => sum + p.volume, 0);

    return {
      current: latest.close,
      change,
      changePercent,
      high,
      low,
      volume: totalVolume
    };
  };

  const stats = getStats();
  const isPositive = stats.change >= 0;

  // Render candlestick chart (SVG)
  const renderCandlestickChart = () => {
    if (priceHistory.length === 0) return null;

    const width = 900;
    const height = 350;
    const padding = { top: 20, right: 60, bottom: 50, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const priceMax = Math.max(...priceHistory.map(p => p.high));
    const priceMin = Math.min(...priceHistory.map(p => p.low));
    const priceRange = priceMax - priceMin;

    const xScale = (index: number) => 
      padding.left + (index / (priceHistory.length - 1)) * chartWidth;
    
    const yScale = (price: number) =>
      padding.top + chartHeight - ((price - priceMin) / priceRange) * chartHeight;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-lg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const price = priceMin + priceRange * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
                fontWeight="500"
              >
                ₹{price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {priceHistory.map((price, index) => {
          const x = xScale(index);
          const candleWidth = Math.max(chartWidth / priceHistory.length - 3, 2);
          
          const openY = yScale(price.open);
          const closeY = yScale(price.close);
          const highY = yScale(price.high);
          const lowY = yScale(price.low);

          const isUp = price.close >= price.open;
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.abs(closeY - openY) || 2;

          return (
            <g key={index}>
              {/* High-Low line (wick) */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={isUp ? '#22c55e' : '#ef4444'}
                strokeWidth="1.5"
              />
              
              {/* Open-Close body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isUp ? '#22c55e' : '#ef4444'}
                opacity={0.9}
                rx="1"
              />
            </g>
          );
        })}

        {/* X-axis dates */}
        {priceHistory.filter((_, i) => i % Math.ceil(priceHistory.length / 8) === 0).map((price, index) => {
          const dataIndex = index * Math.ceil(priceHistory.length / 8);
          const x = xScale(dataIndex);
          return (
            <text
              key={index}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="500"
            >
              {new Date(price.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </text>
          );
        })}

        {/* Chart title */}
        <text
          x={padding.left}
          y={15}
          fontSize="12"
          fill="#334155"
          fontWeight="600"
        >
          {selectedCommodity} Price Movement ({days} Days)
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* NCDEX Live Data Alert */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Live NCDEX Market Data</strong> • Real commodity prices from National Commodity Exchange • Updated daily at 6:30 PM IST
        </AlertDescription>
      </Alert>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Current Price</p>
                <p className="text-2xl font-bold text-purple-900">₹{stats.current.toFixed(2)}</p>
                <p className="text-xs text-purple-500">{selectedCommodity}</p>
              </div>
              <Store className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-${isPositive ? 'green' : 'red'}-200 bg-gradient-to-br from-${isPositive ? 'green' : 'red'}-50 to-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">{days}D Change</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">{isPositive ? '+' : ''}₹{stats.change.toFixed(2)}</p>
              </div>
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">{days}D High</p>
                <p className="text-2xl font-bold text-blue-900">₹{stats.high.toFixed(2)}</p>
                <p className="text-xs text-blue-500">Low: ₹{stats.low.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium">Total Volume</p>
                <p className="text-2xl font-bold text-orange-900">{(stats.volume / 1000).toFixed(0)}K</p>
                <p className="text-xs text-orange-500">Last {days} days</p>
              </div>
              <Volume2 className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commodity Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="w-5 h-5 text-purple-600" />
              Market Prices
            </CardTitle>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={days === d ? "default" : "outline"}
                  onClick={() => setDays(d)}
                  className={days === d ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {d}D
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category-based navigation */}
          <div className="space-y-6">
            {/* Category cards - Select commodity by category */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Grains', 'Pulses', 'Spices', 'Cash Crops'].map((category) => {
                const categoryCommodities = commodities.filter(c => c.category === category);
                const firstCommodity = categoryCommodities[0];
                
                return (
                  <Card 
                    key={category}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2"
                    onClick={() => setSelectedCommodity(firstCommodity.code)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">{firstCommodity.emoji}</div>
                        <p className="font-semibold text-sm">{category}</p>
                        <p className="text-xs text-gray-500">{categoryCommodities.length} commodities</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected commodity display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selected Commodity</p>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-3xl">{commodities.find(c => c.code === selectedCommodity)?.emoji}</span>
                    {commodities.find(c => c.code === selectedCommodity)?.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {commodities.find(c => c.code === selectedCommodity)?.category}
                  </p>
                </div>
                
                {/* Commodity selector dropdown */}
                <div>
                  <select
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white font-medium text-sm"
                  >
                    {commodities.map((commodity) => (
                      <option key={commodity.code} value={commodity.code}>
                        {commodity.emoji} {commodity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

              {/* Candlestick Chart */}
              <div className="w-full overflow-x-auto bg-gray-50 rounded-lg p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Activity className="w-12 h-12 mb-2 opacity-50" />
                  <p>No price data available</p>
                </div>
              ) : (
                renderCandlestickChart()
              )}
            </div>

            {/* Volume bars */}
            {!loading && priceHistory.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Trading Volume</p>
                <div className="flex items-end gap-1 h-24 bg-gray-50 rounded-lg p-3">
                  {priceHistory.map((price, index) => {
                    const maxVolume = Math.max(...priceHistory.map(p => p.volume));
                    const height = (price.volume / maxVolume) * 100;
                    const isUp = price.close >= price.open;
                    return (
                      <div
                        key={index}
                        className={`flex-1 ${isUp ? 'bg-green-500' : 'bg-red-500'} opacity-70 hover:opacity-100 transition-opacity rounded-t`}
                        style={{ height: `${height}%` }}
                        title={`${new Date(price.date).toLocaleDateString()}: ${price.volume.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Prices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            All Commodities - Latest Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {latestPrices.map((price, index) => {
              const change = price.closePrice - price.openPrice;
              const changePercent = (change / price.openPrice) * 100;
              const isUp = change >= 0;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCommodity(price.commodityCode)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {commodities.find(c => c.code === price.commodityCode)?.emoji || '📦'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{price.commodityName}</p>
                      <p className="text-xs text-gray-500">{price.symbol}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{price.closePrice.toFixed(2)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {isUp ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <Badge variant={isUp ? "default" : "destructive"} className="bg-opacity-10">
                    H: ₹{price.highPrice.toFixed(2)} | L: ₹{price.lowPrice.toFixed(2)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer status */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Last Updated: {lastUpdate || 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium text-green-600">Real-time NCDEX Data</span>
        </div>
      </div>
    </div>
  );
}
