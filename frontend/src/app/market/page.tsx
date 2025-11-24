"use client";

/**
 * MARKET PRICES PAGE
 * 
 * Displays real-time NCDEX commodity prices with interactive charts.
 * Shows both current prices and historical trends for major agricultural commodities.
 */

import { MarketPricesDashboard } from '@/components/shared/market-prices-dashboard';
import { MarketPriceChart } from '@/components/shared/market-price-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Calendar, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MarketPage() {
  const majorCommodities = [
    { code: 'WHEAT', name: 'Wheat', icon: '🌾' },
    { code: 'RICE', name: 'Rice', icon: '🍚' },
    { code: 'COTTON', name: 'Cotton', icon: '🌱' },
    { code: 'SOYBEAN', name: 'Soybean', icon: '🫘' },
    { code: 'MAIZE', name: 'Maize', icon: '🌽' },
    { code: 'TURMERIC', name: 'Turmeric', icon: '🟡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                Agricultural Market Prices
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time NCDEX commodity prices • Updated daily at 6:30 PM IST
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last 90 days available</span>
            </div>
          </div>

          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Live Market Data:</strong> Prices sourced from National Commodity & Derivatives Exchange (NCDEX). 
              Charts show OHLC (Open, High, Low, Close) candlesticks with volume analysis.
            </AlertDescription>
          </Alert>
        </div>

        {/* Current Prices Dashboard */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Current Prices
          </h2>
          <MarketPricesDashboard />
        </div>

        {/* Price Charts */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Price Trends & Analysis
          </h2>

          <Tabs defaultValue="WHEAT" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              {majorCommodities.map((commodity) => (
                <TabsTrigger key={commodity.code} value={commodity.code} className="gap-2">
                  <span>{commodity.icon}</span>
                  <span className="hidden md:inline">{commodity.name}</span>
                  <span className="md:hidden">{commodity.code}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {majorCommodities.map((commodity) => (
              <TabsContent key={commodity.code} value={commodity.code} className="mt-6">
                <MarketPriceChart commodity={commodity.code} defaultDays={30} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-800">
                📈 How to Read Charts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p><strong>Green Candles:</strong> Price increased (Close &gt; Open)</p>
              <p><strong>Red Candles:</strong> Price decreased (Close &lt; Open)</p>
              <p><strong>Wick/Shadow:</strong> Shows High and Low prices</p>
              <p><strong>Volume Bars:</strong> Trading activity indicator</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-800">
                ℹ️ About NCDEX
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>National Commodity & Derivatives Exchange of India</p>
              <p><strong>Established:</strong> 2003</p>
              <p><strong>Regulator:</strong> SEBI</p>
              <p><strong>Trading Hours:</strong> 10:00 AM - 5:00 PM IST</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-800">
                💡 For Farmers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>Use these prices to:</p>
              <p>✓ Plan your crop sales timing</p>
              <p>✓ Negotiate fair prices with buyers</p>
              <p>✓ Track seasonal price trends</p>
              <p>✓ Make informed farming decisions</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Data sourced from NCDEX Bhavcopy • Prices in ₹ per quintal (100kg)</p>
          <p className="mt-1">For informational purposes only • Not financial advice</p>
        </div>
      </div>
    </div>
  );
}
