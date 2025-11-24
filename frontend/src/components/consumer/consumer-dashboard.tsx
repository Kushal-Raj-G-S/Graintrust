'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Truck,
  Star,
  History,
  Store,
  TrendingUp
} from 'lucide-react'
import { Marketplace } from './marketplace';
import { AdvancedMarketPrices } from './ncdex-market-prices';

interface ProductTrace {
  id: string
  name: string
  origin: string
  farmer: string
  harvestDate: string
  certifications: string[]
  currentLocation: string
  status: 'verified' | 'pending' | 'warning'
}

const mockProducts: ProductTrace[] = [
  {
    id: 'GRN001',
    name: 'Organic Basmati Rice',
    origin: 'Punjab, India',
    farmer: 'Rajesh Kumar',
    harvestDate: '2024-03-15',
    certifications: ['Organic', 'Fair Trade'],
    currentLocation: 'Bangalore Distribution Center',
    status: 'verified'
  },
  {
    id: 'GRN002',
    name: 'Premium Wheat Flour',
    origin: 'Haryana, India',
    farmer: 'Suresh Patel',
    harvestDate: '2024-03-20',
    certifications: ['Quality Assured'],
    currentLocation: 'Local Store',
    status: 'verified'
  }
]

export function ConsumerDashboard(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState('')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent tracking-tight mb-1">
          Consumer Dashboard
        </h1>
        <p className="text-sm text-slate-600 font-medium">Shop verified products & track supply chain transparency</p>
      </motion.div>

      {/* Tabs for Marketplace, Market Prices and Verification */}
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="marketplace" className="gap-2">
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="prices" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Prices
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <Search className="h-4 w-4" />
            Product Verification
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <Marketplace />
        </TabsContent>

        {/* Market Prices Tab */}
        <TabsContent value="prices">
          <AdvancedMarketPrices />
        </TabsContent>

        {/* Product Verification Tab */}
        <TabsContent value="verification">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Products</p>
                <p className="text-2xl font-bold text-green-600">24</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">156</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Traces</p>
                <p className="text-2xl font-bold text-orange-600">8</p>
              </div>
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Track Product
            </CardTitle>
            <CardDescription>
              Enter product code or scan QR code to verify authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter product code (e.g., GRN001)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Search className="w-4 h-4 mr-2" />
                Track
              </Button>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Products
            </CardTitle>
            <CardDescription>
              Your recently tracked and purchased products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600">Code: {product.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(product.status)}
                      <Badge className={getStatusColor(product.status)}>
                        {product.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Origin</p>
                      <p className="font-medium">{product.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Farmer</p>
                      <p className="font-medium">{product.farmer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Harvest Date</p>
                      <p className="font-medium">{product.harvestDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-medium">{product.currentLocation}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Certifications</p>
                    <div className="flex gap-2">
                      {product.certifications.map((cert) => (
                        <Badge key={cert} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      View Full Trace
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="w-4 h-4 mr-1" />
                      Rate Product
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
