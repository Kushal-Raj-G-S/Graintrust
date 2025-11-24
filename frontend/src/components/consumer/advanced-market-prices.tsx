'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  Volume2,
  Zap,
  RefreshCw,
  Maximize2,
  BookOpen,
  TrendingUpIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CropPrice {
  id: string;
  name: string;
  symbol: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  unit: string;
  lastUpdated: string;
  weeklyData: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  orderBook: {
    bids: { price: number; quantity: number; total: number }[];
    asks: { price: number; quantity: number; total: number }[];
  };
  recentTrades: {
    time: string;
    price: number;
    quantity: number;
    type: 'buy' | 'sell';
  }[];
}

// Advanced market data with order book and recent trades
const ADVANCED_MARKET_DATA: CropPrice[] = [
  {
    id: '1',
    name: 'Wheat',
    symbol: 'WHT',
    category: 'Grains',
    currentPrice: 2850,
    previousPrice: 2720,
    change: 130,
    changePercent: 4.78,
    trend: 'up',
    high24h: 2920,
    low24h: 2650,
    volume24h: 15420,
    marketCap: 43950000,
    unit: 'quintal',
    lastUpdated: new Date().toLocaleString(),
    weeklyData: [
      { time: '09:00', open: 2720, high: 2750, low: 2690, close: 2730, volume: 3200 },
      { time: '10:00', open: 2730, high: 2780, low: 2720, close: 2760, volume: 3500 },
      { time: '11:00', open: 2760, high: 2820, low: 2750, close: 2800, volume: 4100 },
      { time: '12:00', open: 2800, high: 2850, low: 2790, close: 2830, volume: 2800 },
      { time: '13:00', open: 2830, high: 2900, low: 2820, close: 2850, volume: 3900 },
    ],
    orderBook: {
      bids: [
        { price: 2849, quantity: 125, total: 356125 },
        { price: 2848, quantity: 89, total: 253472 },
        { price: 2847, quantity: 156, total: 444132 },
        { price: 2846, quantity: 234, total: 665964 },
        { price: 2845, quantity: 178, total: 506410 },
        { price: 2844, quantity: 267, total: 759348 },
        { price: 2843, quantity: 145, total: 412235 },
      ],
      asks: [
        { price: 2850, quantity: 98, total: 279300 },
        { price: 2851, quantity: 156, total: 444756 },
        { price: 2852, quantity: 234, total: 667368 },
        { price: 2853, quantity: 189, total: 539217 },
        { price: 2854, quantity: 267, total: 762018 },
        { price: 2855, quantity: 145, total: 413975 },
        { price: 2856, quantity: 223, total: 636888 },
      ]
    },
    recentTrades: [
      { time: '14:32:45', price: 2850, quantity: 45, type: 'buy' },
      { time: '14:32:23', price: 2849, quantity: 23, type: 'sell' },
      { time: '14:31:58', price: 2851, quantity: 67, type: 'buy' },
      { time: '14:31:34', price: 2850, quantity: 34, type: 'buy' },
      { time: '14:31:12', price: 2848, quantity: 89, type: 'sell' },
      { time: '14:30:56', price: 2849, quantity: 56, type: 'buy' },
      { time: '14:30:34', price: 2850, quantity: 123, type: 'buy' },
      { time: '14:30:12', price: 2847, quantity: 78, type: 'sell' },
    ]
  },
  {
    id: '2',
    name: 'Rice (Basmati)',
    symbol: 'RICE',
    category: 'Grains',
    currentPrice: 4250,
    previousPrice: 4180,
    change: 70,
    changePercent: 1.67,
    trend: 'up',
    high24h: 4310,
    low24h: 4100,
    volume24h: 12350,
    marketCap: 52487500,
    unit: 'quintal',
    lastUpdated: new Date().toLocaleString(),
    weeklyData: [
      { time: '09:00', open: 4180, high: 4200, low: 4150, close: 4190, volume: 2500 },
      { time: '10:00', open: 4190, high: 4220, low: 4180, close: 4210, volume: 2800 },
      { time: '11:00', open: 4210, high: 4250, low: 4200, close: 4230, volume: 3200 },
      { time: '12:00', open: 4230, high: 4270, low: 4220, close: 4240, volume: 2100 },
      { time: '13:00', open: 4240, high: 4300, low: 4230, close: 4250, volume: 3100 },
    ],
    orderBook: {
      bids: [
        { price: 4249, quantity: 87, total: 369663 },
        { price: 4248, quantity: 134, total: 569232 },
        { price: 4247, quantity: 98, total: 416206 },
        { price: 4246, quantity: 167, total: 709082 },
        { price: 4245, quantity: 223, total: 946635 },
      ],
      asks: [
        { price: 4250, quantity: 112, total: 476000 },
        { price: 4251, quantity: 145, total: 616395 },
        { price: 4252, quantity: 189, total: 803628 },
        { price: 4253, quantity: 234, total: 995202 },
        { price: 4254, quantity: 156, total: 663624 },
      ]
    },
    recentTrades: [
      { time: '14:33:12', price: 4250, quantity: 34, type: 'buy' },
      { time: '14:32:56', price: 4249, quantity: 56, type: 'sell' },
      { time: '14:32:34', price: 4251, quantity: 78, type: 'buy' },
      { time: '14:32:12', price: 4250, quantity: 45, type: 'buy' },
      { time: '14:31:58', price: 4248, quantity: 67, type: 'sell' },
    ]
  },
  {
    id: '3',
    name: 'Maize (Corn)',
    symbol: 'MZE',
    category: 'Grains',
    currentPrice: 1920,
    previousPrice: 1980,
    change: -60,
    changePercent: -3.03,
    trend: 'down',
    high24h: 2050,
    low24h: 1900,
    volume24h: 18750,
    marketCap: 36000000,
    unit: 'quintal',
    lastUpdated: new Date().toLocaleString(),
    weeklyData: [
      { time: '09:00', open: 1980, high: 2000, low: 1960, close: 1975, volume: 3800 },
      { time: '10:00', open: 1975, high: 1990, low: 1950, close: 1960, volume: 4200 },
      { time: '11:00', open: 1960, high: 1970, low: 1940, close: 1950, volume: 3900 },
      { time: '12:00', open: 1950, high: 1960, low: 1920, close: 1930, volume: 3600 },
      { time: '13:00', open: 1930, high: 1940, low: 1900, close: 1920, volume: 4100 },
    ],
    orderBook: {
      bids: [
        { price: 1919, quantity: 234, total: 449046 },
        { price: 1918, quantity: 189, total: 362502 },
        { price: 1917, quantity: 267, total: 511839 },
        { price: 1916, quantity: 145, total: 277820 },
        { price: 1915, quantity: 312, total: 597480 },
      ],
      asks: [
        { price: 1920, quantity: 198, total: 380160 },
        { price: 1921, quantity: 223, total: 428383 },
        { price: 1922, quantity: 156, total: 299832 },
        { price: 1923, quantity: 289, total: 555747 },
        { price: 1924, quantity: 178, total: 342472 },
      ]
    },
    recentTrades: [
      { time: '14:33:45', price: 1920, quantity: 89, type: 'sell' },
      { time: '14:33:23', price: 1921, quantity: 67, type: 'sell' },
      { time: '14:32:58', price: 1919, quantity: 123, type: 'sell' },
      { time: '14:32:34', price: 1920, quantity: 45, type: 'buy' },
      { time: '14:32:12', price: 1918, quantity: 78, type: 'sell' },
    ]
  },
];

export function AdvancedMarketPrices() {
  const { t } = useTranslate();
  const [selectedCrop, setSelectedCrop] = useState<CropPrice>(ADVANCED_MARKET_DATA[0]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses'];

  // Simulate live price updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate price fluctuation
      setSelectedCrop(prev => ({
        ...prev,
        currentPrice: prev.currentPrice + (Math.random() - 0.5) * 10,
        lastUpdated: new Date().toLocaleString()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredData = filterCategory === 'All' 
    ? ADVANCED_MARKET_DATA 
    : ADVANCED_MARKET_DATA.filter(crop => crop.category === filterCategory);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case 'up': return 'bg-green-500/10';
      case 'down': return 'bg-red-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Top Bar - Modern Light Style */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Agri Market Pro
                </h1>
                <p className="text-xs text-slate-500">Live Market Prices</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
                <span className="text-slate-600">24h Vol:</span>
                <span className="text-slate-900 font-semibold">₹1.2B</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-slate-600">Markets:</span>
                <span className="text-slate-900 font-semibold">10</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' : 'border-slate-300'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Live
            </Button>
            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              <Zap className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Market List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Markets</CardTitle>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterCategory(cat)}
                      className={`text-xs ${
                        filterCategory === cat
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span>Pair</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Change</span>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {filteredData.map((crop) => (
                    <div
                      key={crop.id}
                      onClick={() => setSelectedCrop(crop)}
                      className={`px-4 py-3 cursor-pointer border-b border-slate-100 transition-all hover:bg-slate-50 ${
                        selectedCrop.id === crop.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{crop.symbol}/INR</div>
                          <div className="text-xs text-slate-500">{crop.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-slate-900">₹{crop.currentPrice.toFixed(0)}</div>
                          <div className="text-xs text-slate-500">Vol: {(crop.volume24h/1000).toFixed(1)}K</div>
                        </div>
                        <div className={`text-right font-bold text-sm ${crop.trend === 'up' ? 'text-green-600' : crop.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                          {crop.changePercent > 0 ? '+' : ''}{crop.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Chart Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="shadow-lg border-slate-200 mb-6">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedCrop.name}</h2>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {selectedCrop.symbol}/INR
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-4xl font-bold text-slate-900">₹{selectedCrop.currentPrice.toFixed(2)}</span>
                      <span className={`text-lg font-bold flex items-center gap-1 ${selectedCrop.trend === 'up' ? 'text-green-600' : selectedCrop.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                        {selectedCrop.trend === 'up' ? <ArrowUp className="h-5 w-5" /> : selectedCrop.trend === 'down' ? <ArrowDown className="h-5 w-5" /> : null}
                        {selectedCrop.changePercent > 0 ? '+' : ''}{selectedCrop.changePercent.toFixed(2)}%
                      </span>
                      <span className={`text-sm font-semibold ${selectedCrop.trend === 'up' ? 'text-green-600' : selectedCrop.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                        {selectedCrop.change > 0 ? '+' : ''}₹{selectedCrop.change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={chartType === 'candlestick' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('candlestick')}
                      className={chartType === 'candlestick' ? 'bg-slate-900 hover:bg-slate-800' : 'border-slate-300'}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Candles
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <span className="text-xs text-green-700 font-medium block mb-1">24h High</span>
                    <div className="font-bold text-lg text-green-600">₹{selectedCrop.high24h}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
                    <span className="text-xs text-red-700 font-medium block mb-1">24h Low</span>
                    <div className="font-bold text-lg text-red-600">₹{selectedCrop.low24h}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                    <span className="text-xs text-blue-700 font-medium block mb-1">24h Volume</span>
                    <div className="font-bold text-lg text-blue-600">{(selectedCrop.volume24h/1000).toFixed(1)}K</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <span className="text-xs text-purple-700 font-medium block mb-1">Market Cap</span>
                    <div className="font-bold text-lg text-purple-600">₹{(selectedCrop.marketCap/1000000).toFixed(1)}M</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Chart Canvas */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 p-6">
                  <div className="h-80 flex items-end justify-around gap-3">
                    {selectedCrop.weeklyData.map((data, index) => {
                      const isGreen = data.close >= data.open;
                      const maxPrice = Math.max(...selectedCrop.weeklyData.map(d => d.high));
                      const minPrice = Math.min(...selectedCrop.weeklyData.map(d => d.low));
                      const priceRange = maxPrice - minPrice;
                      
                      const wickHeight = ((data.high - data.low) / priceRange) * 100;
                      const bodyHeight = Math.abs(((data.close - data.open) / priceRange) * 100);
                      const bodyBottom = ((Math.min(data.open, data.close) - minPrice) / priceRange) * 100;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div className="relative w-full flex justify-center" style={{ height: '280px' }}>
                            {/* Volume bar at bottom */}
                            <div 
                              className="absolute bottom-0 w-full bg-blue-200/40 rounded-t"
                              style={{ height: `${(data.volume / Math.max(...selectedCrop.weeklyData.map(d => d.volume))) * 60}px` }}
                            />
                            
                            {/* Wick */}
                            <div 
                              className={`absolute w-0.5 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{
                                height: `${wickHeight}%`,
                                bottom: `${((data.low - minPrice) / priceRange) * 100}%`
                              }}
                            />
                            
                            {/* Candle body */}
                            <div 
                              className={`absolute w-10 ${isGreen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} transition-all cursor-pointer rounded-sm shadow-md`}
                              style={{
                                height: `${bodyHeight || 2}%`,
                                bottom: `${bodyBottom}%`
                              }}
                            />

                            {/* Tooltip on hover */}
                            <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-xl">
                              <div className="font-bold mb-2 text-center border-b border-slate-700 pb-1">{data.time}</div>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Open:</span>
                                  <span className="font-semibold">₹{data.open}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-green-400">High:</span>
                                  <span className="font-semibold text-green-400">₹{data.high}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-red-400">Low:</span>
                                  <span className="font-semibold text-red-400">₹{data.low}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Close:</span>
                                  <span className="font-semibold">₹{data.close}</span>
                                </div>
                                <div className="flex justify-between gap-3 pt-1 border-t border-slate-700">
                                  <span className="text-blue-400">Vol:</span>
                                  <span className="font-semibold text-blue-400">{data.volume}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 font-semibold mt-3">{data.time}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Market Stats & Price History */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-lg border-slate-200">
              <Tabs defaultValue="stats" className="h-full">
                <TabsList className="w-full grid grid-cols-2 bg-slate-100 rounded-none border-b border-slate-200">
                  <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                    <Clock className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-0 p-4 space-y-4">
                  {/* Market Overview */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Market Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <span className="text-xs text-green-700 font-medium">Opening Price</span>
                        <span className="text-sm font-bold text-green-600">₹{selectedCrop.weeklyData[0].open}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                        <span className="text-xs text-blue-700 font-medium">Current Price</span>
                        <span className="text-sm font-bold text-blue-600">₹{selectedCrop.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                        <span className="text-xs text-purple-700 font-medium">Avg. Price</span>
                        <span className="text-sm font-bold text-purple-600">
                          ₹{(selectedCrop.weeklyData.reduce((sum, d) => sum + d.close, 0) / selectedCrop.weeklyData.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trading Activity */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Trading Activity</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-600">Total Volume</span>
                          <span className="text-sm font-bold text-slate-900">{selectedCrop.volume24h.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-600">Market Cap</span>
                          <span className="text-sm font-bold text-slate-900">₹{(selectedCrop.marketCap / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Price Range (24h)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-red-600 font-semibold">Low: ₹{selectedCrop.low24h}</span>
                        <span className="text-green-600 font-semibold">High: ₹{selectedCrop.high24h}</span>
                      </div>
                      <div className="relative w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full">
                        <div 
                          className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                          style={{ 
                            left: `${((selectedCrop.currentPrice - selectedCrop.low24h) / (selectedCrop.high24h - selectedCrop.low24h)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-center text-xs text-slate-600 font-medium">
                        Current: ₹{selectedCrop.currentPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  <div className={`p-4 rounded-lg border-2 ${
                    selectedCrop.trend === 'up' 
                      ? 'bg-green-50 border-green-200' 
                      : selectedCrop.trend === 'down'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {selectedCrop.trend === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : selectedCrop.trend === 'down' ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Activity className="h-5 w-5 text-gray-600" />
                      )}
                      <span className={`font-bold ${
                        selectedCrop.trend === 'up' 
                          ? 'text-green-600' 
                          : selectedCrop.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {selectedCrop.trend === 'up' ? 'Bullish' : selectedCrop.trend === 'down' ? 'Bearish' : 'Neutral'} Trend
                      </span>
                    </div>
                    <p className="text-xs text-center text-slate-600">
                      {selectedCrop.trend === 'up' 
                        ? 'Price is trending upward. Good time to sell.' 
                        : selectedCrop.trend === 'down'
                        ? 'Price is trending downward. Consider waiting.'
                        : 'Price is stable. Market is balanced.'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  {/* Price History */}
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-3 text-xs font-semibold text-slate-500">
                      <span>Time</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Change</span>
                    </div>
                  </div>

                  <div className="max-h-[600px] overflow-y-auto">
                    {selectedCrop.weeklyData.map((data, index) => {
                      const prevClose = index > 0 ? selectedCrop.weeklyData[index - 1].close : data.open;
                      const change = data.close - prevClose;
                      const changePercent = ((change / prevClose) * 100);
                      const isPositive = change >= 0;

                      return (
                        <div
                          key={index}
                          className="px-3 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                        >
                          <div className="grid grid-cols-3 text-xs items-center">
                            <div>
                              <div className="font-semibold text-slate-900">{data.time}</div>
                              <div className="text-[10px] text-slate-500">Vol: {data.volume}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">₹{data.close}</div>
                              <div className="text-[10px] text-slate-500">O: ₹{data.open}</div>
                            </div>
                            <div className={`text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {isPositive ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                                <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
                              </div>
                              <div className="text-[10px]">
                                {change > 0 ? '+' : ''}₹{change.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6 text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Last Updated: <span className="text-slate-900">{selectedCrop.lastUpdated}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">24h Volume: <span className="text-slate-900">₹{(selectedCrop.volume24h * selectedCrop.currentPrice / 100000).toFixed(2)}L</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 font-semibold">Real-time Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
