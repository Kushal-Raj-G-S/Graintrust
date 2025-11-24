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
  Minus,
  Activity,
  Clock,
  Volume2,
  Zap,
  AreaChart,
  Info
} from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';

interface CropPrice {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  high: number;
  low: number;
  volume: number;
  unit: string;
  lastUpdated: string;
  weeklyData: {
    day: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  orderBook: {
    bids: { price: number; quantity: number }[];
    asks: { price: number; quantity: number }[];
  };
  recentTrades: {
    time: string;
    price: number;
    quantity: number;
    type: 'buy' | 'sell';
  }[];
}

// Hardcoded market data for 10 crops
const MARKET_DATA: CropPrice[] = [
  {
    id: '1',
    name: 'Wheat',
    category: 'Grains',
    currentPrice: 2850,
    previousPrice: 2720,
    change: 130,
    changePercent: 4.78,
    trend: 'up',
    high: 2900,
    low: 2650,
    volume: 15420,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 2720, high: 2750, low: 2690, close: 2730 },
      { day: 'Tue', open: 2730, high: 2780, low: 2720, close: 2760 },
      { day: 'Wed', open: 2760, high: 2820, low: 2750, close: 2800 },
      { day: 'Thu', open: 2800, high: 2850, low: 2790, close: 2830 },
      { day: 'Fri', open: 2830, high: 2900, low: 2820, close: 2850 },
    ]
  },
  {
    id: '2',
    name: 'Rice (Basmati)',
    category: 'Grains',
    currentPrice: 4250,
    previousPrice: 4180,
    change: 70,
    changePercent: 1.67,
    trend: 'up',
    high: 4300,
    low: 4100,
    volume: 12350,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 4180, high: 4200, low: 4150, close: 4190 },
      { day: 'Tue', open: 4190, high: 4220, low: 4180, close: 4210 },
      { day: 'Wed', open: 4210, high: 4250, low: 4200, close: 4230 },
      { day: 'Thu', open: 4230, high: 4270, low: 4220, close: 4240 },
      { day: 'Fri', open: 4240, high: 4300, low: 4230, close: 4250 },
    ]
  },
  {
    id: '3',
    name: 'Maize (Corn)',
    category: 'Grains',
    currentPrice: 1920,
    previousPrice: 1980,
    change: -60,
    changePercent: -3.03,
    trend: 'down',
    high: 2050,
    low: 1900,
    volume: 18750,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 1980, high: 2000, low: 1960, close: 1975 },
      { day: 'Tue', open: 1975, high: 1990, low: 1950, close: 1960 },
      { day: 'Wed', open: 1960, high: 1970, low: 1940, close: 1950 },
      { day: 'Thu', open: 1950, high: 1960, low: 1920, close: 1930 },
      { day: 'Fri', open: 1930, high: 1940, low: 1900, close: 1920 },
    ]
  },
  {
    id: '4',
    name: 'Potato',
    category: 'Vegetables',
    currentPrice: 1580,
    previousPrice: 1550,
    change: 30,
    changePercent: 1.94,
    trend: 'up',
    high: 1650,
    low: 1480,
    volume: 22100,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 1550, high: 1570, low: 1540, close: 1560 },
      { day: 'Tue', open: 1560, high: 1580, low: 1550, close: 1570 },
      { day: 'Wed', open: 1570, high: 1590, low: 1565, close: 1575 },
      { day: 'Thu', open: 1575, high: 1600, low: 1570, close: 1580 },
      { day: 'Fri', open: 1580, high: 1600, low: 1575, close: 1580 },
    ]
  },
  {
    id: '5',
    name: 'Onion',
    category: 'Vegetables',
    currentPrice: 2340,
    previousPrice: 2340,
    change: 0,
    changePercent: 0,
    trend: 'stable',
    high: 2450,
    low: 2250,
    volume: 19800,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 2340, high: 2360, low: 2320, close: 2340 },
      { day: 'Tue', open: 2340, high: 2355, low: 2330, close: 2345 },
      { day: 'Wed', open: 2345, high: 2360, low: 2335, close: 2340 },
      { day: 'Thu', open: 2340, high: 2350, low: 2330, close: 2340 },
      { day: 'Fri', open: 2340, high: 2350, low: 2335, close: 2340 },
    ]
  },
  {
    id: '6',
    name: 'Tomato',
    category: 'Vegetables',
    currentPrice: 1875,
    previousPrice: 2120,
    change: -245,
    changePercent: -11.56,
    trend: 'down',
    high: 2300,
    low: 1850,
    volume: 16500,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 2120, high: 2150, low: 2100, close: 2110 },
      { day: 'Tue', open: 2110, high: 2120, low: 2050, close: 2070 },
      { day: 'Wed', open: 2070, high: 2080, low: 2000, close: 2020 },
      { day: 'Thu', open: 2020, high: 2030, low: 1950, close: 1960 },
      { day: 'Fri', open: 1960, high: 1980, low: 1850, close: 1875 },
    ]
  },
  {
    id: '7',
    name: 'Apple',
    category: 'Fruits',
    currentPrice: 8500,
    previousPrice: 8350,
    change: 150,
    changePercent: 1.80,
    trend: 'up',
    high: 8700,
    low: 8200,
    volume: 8900,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 8350, high: 8400, low: 8300, close: 8370 },
      { day: 'Tue', open: 8370, high: 8420, low: 8350, close: 8400 },
      { day: 'Wed', open: 8400, high: 8450, low: 8390, close: 8430 },
      { day: 'Thu', open: 8430, high: 8480, low: 8420, close: 8460 },
      { day: 'Fri', open: 8460, high: 8550, low: 8450, close: 8500 },
    ]
  },
  {
    id: '8',
    name: 'Banana',
    category: 'Fruits',
    currentPrice: 2650,
    previousPrice: 2580,
    change: 70,
    changePercent: 2.71,
    trend: 'up',
    high: 2700,
    low: 2500,
    volume: 13400,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 2580, high: 2600, low: 2560, close: 2590 },
      { day: 'Tue', open: 2590, high: 2610, low: 2580, close: 2600 },
      { day: 'Wed', open: 2600, high: 2630, low: 2595, close: 2620 },
      { day: 'Thu', open: 2620, high: 2650, low: 2615, close: 2640 },
      { day: 'Fri', open: 2640, high: 2670, low: 2635, close: 2650 },
    ]
  },
  {
    id: '9',
    name: 'Tur Dal (Pigeon Pea)',
    category: 'Pulses',
    currentPrice: 7850,
    previousPrice: 7750,
    change: 100,
    changePercent: 1.29,
    trend: 'up',
    high: 7950,
    low: 7650,
    volume: 9200,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 7750, high: 7780, low: 7720, close: 7760 },
      { day: 'Tue', open: 7760, high: 7800, low: 7750, close: 7780 },
      { day: 'Wed', open: 7780, high: 7820, low: 7770, close: 7800 },
      { day: 'Thu', open: 7800, high: 7840, low: 7790, close: 7820 },
      { day: 'Fri', open: 7820, high: 7880, low: 7810, close: 7850 },
    ]
  },
  {
    id: '10',
    name: 'Chickpea (Chana)',
    category: 'Pulses',
    currentPrice: 5420,
    previousPrice: 5480,
    change: -60,
    changePercent: -1.09,
    trend: 'down',
    high: 5550,
    low: 5380,
    volume: 11750,
    unit: 'quintal',
    lastUpdated: '2025-01-25 10:30 AM',
    weeklyData: [
      { day: 'Mon', open: 5480, high: 5500, low: 5460, close: 5470 },
      { day: 'Tue', open: 5470, high: 5490, low: 5450, close: 5460 },
      { day: 'Wed', open: 5460, high: 5470, low: 5430, close: 5440 },
      { day: 'Thu', open: 5440, high: 5450, low: 5410, close: 5420 },
      { day: 'Fri', open: 5420, high: 5440, low: 5380, close: 5420 },
    ]
  },
];

export function MarketPrices() {
  const { t } = useTranslate();
  const [selectedCrop, setSelectedCrop] = useState<CropPrice | null>(MARKET_DATA[0]);
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses'];

  const filteredData = filterCategory === 'All' 
    ? MARKET_DATA 
    : MARKET_DATA.filter(crop => crop.category === filterCategory);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'bg-green-50 border-green-200';
      case 'down':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight mb-1">
            {t('marketPrices.title')}
          </h1>
          <p className="text-sm text-slate-600 font-medium">{t('marketPrices.subtitle')}</p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={filterCategory === category ? 'default' : 'outline'}
            onClick={() => setFilterCategory(category)}
            className={filterCategory === category ? 'bg-blue-600 hover:bg-blue-700' : ''}
            size="sm"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price List */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('marketPrices.livePrices')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredData.map((crop) => (
                <div
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedCrop?.id === crop.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : getTrendBg(crop.trend)
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{crop.name}</h3>
                      <p className="text-xs text-gray-500">{crop.category}</p>
                    </div>
                    {getTrendIcon(crop.trend)}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold">₹{crop.currentPrice}</p>
                      <p className="text-xs text-gray-500">per {crop.unit}</p>
                    </div>
                    <div className={`text-right ${getTrendColor(crop.trend)}`}>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        {crop.change > 0 ? <ArrowUp className="h-3 w-3" /> : crop.change < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                        {crop.changePercent > 0 ? '+' : ''}{crop.changePercent}%
                      </p>
                      <p className="text-xs">{crop.change > 0 ? '+' : ''}₹{crop.change}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chart & Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCrop && (
            <>
              {/* Crop Details Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedCrop.name}</h2>
                      <Badge variant="outline">{selectedCrop.category}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">₹{selectedCrop.currentPrice}</p>
                      <p className="text-sm text-gray-500">per {selectedCrop.unit}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t('marketPrices.change')}</p>
                      <p className={`text-lg font-bold ${getTrendColor(selectedCrop.trend)}`}>
                        {selectedCrop.change > 0 ? '+' : ''}₹{selectedCrop.change}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t('marketPrices.changePercent')}</p>
                      <p className={`text-lg font-bold ${getTrendColor(selectedCrop.trend)}`}>
                        {selectedCrop.changePercent > 0 ? '+' : ''}{selectedCrop.changePercent}%
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t('marketPrices.high')}</p>
                      <p className="text-lg font-bold text-green-600">₹{selectedCrop.high}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t('marketPrices.low')}</p>
                      <p className="text-lg font-bold text-red-600">₹{selectedCrop.low}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>{t('marketPrices.volume')}: {selectedCrop.volume.toLocaleString()} {selectedCrop.unit}</span>
                    </div>
                    <span className="text-xs">{t('marketPrices.lastUpdated')}: {selectedCrop.lastUpdated}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Candlestick Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('marketPrices.weeklyTrend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Bar Chart */}
                    <div className="h-64 flex items-end justify-around gap-2 border-b border-l border-gray-300 pb-2 pl-2">
                      {selectedCrop.weeklyData.map((data, index) => {
                        const isGreen = data.close >= data.open;
                        const height = ((data.high - selectedCrop.low) / (selectedCrop.high - selectedCrop.low)) * 100;
                        const bodyHeight = Math.abs(((data.close - data.open) / (selectedCrop.high - selectedCrop.low)) * 100);
                        const bodyBottom = ((Math.min(data.open, data.close) - selectedCrop.low) / (selectedCrop.high - selectedCrop.low)) * 100;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="relative w-full flex justify-center" style={{ height: '200px' }}>
                              {/* Wick (high-low line) */}
                              <div 
                                className="absolute w-0.5 bg-gray-400"
                                style={{
                                  height: `${height}%`,
                                  bottom: `${((selectedCrop.low - selectedCrop.low) / (selectedCrop.high - selectedCrop.low)) * 100}%`
                                }}
                              />
                              {/* Candle body */}
                              <div 
                                className={`absolute w-8 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{
                                  height: `${bodyHeight || 2}%`,
                                  bottom: `${bodyBottom}%`
                                }}
                              />
                            </div>
                            <p className="text-xs font-medium text-gray-600 mt-2">{data.day}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {selectedCrop.weeklyData.map((data, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <p className="font-semibold mb-1">{data.day}</p>
                          <div className="space-y-0.5">
                            <p className="text-gray-600">O: ₹{data.open}</p>
                            <p className="text-green-600">H: ₹{data.high}</p>
                            <p className="text-red-600">L: ₹{data.low}</p>
                            <p className="text-gray-900 font-semibold">C: ₹{data.close}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
