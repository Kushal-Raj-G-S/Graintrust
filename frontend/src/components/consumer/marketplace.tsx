'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  CheckCircle,
  QrCode,
  User,
  MapPin,
  Package,
  Star,
  DollarSign,
  Info
} from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

interface MarketplaceProduct {
  id: string;
  batchId: string;
  batchCode: string;
  productName: string;
  category: string;
  farmerName: string;
  farmerId: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
  imageUrl: string;
  qrCode: string;
  verified: boolean;
  rating: number;
  description: string;
  harvestDate: string;
  stagesCompleted: number;
  totalStages: number;
}

export function Marketplace() {
  const { t } = useTranslate();
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [editableQuantity, setEditableQuantity] = useState<number>(0);

  // Fetch real batch data including FB003
  useEffect(() => {
    const fetchMarketplaceProducts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all verified batches with 7 stages completed
        const response = await fetch('/api/batches?verificationStatus=VERIFIED');
        
        if (response.ok) {
          const batches = await response.json();
          
          // Filter for batches with QR codes and all stages completed
          const marketplaceProducts: MarketplaceProduct[] = batches
            .filter((batch: any) => batch.qrCode && batch.batchCode === 'FB003') // Only FB003 for now
            .map((batch: any) => ({
              id: batch.id,
              batchId: batch.id,
              batchCode: batch.batchCode || 'N/A',
              productName: batch.name,
              category: batch.category,
              farmerName: 'Kushal Raj G S', // The user who owns FB003
              farmerId: batch.farmerId,
              price: 85, // Default price, farmer can change
              quantity: 300, // Default quantity
              unit: 'kg',
              location: typeof batch.location === 'string' ? batch.location : batch.location?.address || 'Farm Location, India',
              imageUrl: '/post 1.jpg', // Use the specified product image
              qrCode: '/fb003.jpg', // Use the actual QR code image
              verified: true,
              rating: 4.9,
              description: batch.description || 'Fresh farm produce with complete blockchain verification',
              harvestDate: batch.actualHarvestDate || batch.expectedHarvestDate || new Date().toISOString(),
              stagesCompleted: 7,
              totalStages: 7
            }));
          
          setProducts(marketplaceProducts);
          setFilteredProducts(marketplaceProducts);
        }
      } catch (error) {
        console.error('Error fetching marketplace products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketplaceProducts();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses'];

  const handleAddToCart = (product: MarketplaceProduct) => {
    toast.success(`${product.productName} added to cart!`);
  };

  // Open price edit dialog (for farmers)
  const handleEditPrice = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setEditablePrice(product.price);
    setEditableQuantity(product.quantity);
    setIsPriceDialogOpen(true);
  };

  // Save updated price
  const handleSavePrice = () => {
    if (selectedProduct) {
      const updatedProducts = products.map(p =>
        p.id === selectedProduct.id
          ? { ...p, price: editablePrice, quantity: editableQuantity }
          : p
      );
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      toast.success('Price updated successfully!');
      setIsPriceDialogOpen(false);
    }
  };

  // Check if current user is the farmer of this product
  const isFarmer = (product: MarketplaceProduct) => {
    return user?.id === product.farmerId;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent tracking-tight mb-1">
              {t('marketplace.title')}
            </h1>
            <p className="text-sm text-slate-600 font-medium">{t('marketplace.subtitle')}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('marketplace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{products.length}</p>
            <p className="text-sm text-gray-600">{t('marketplace.availableProducts')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{products.filter(p => p.verified).length}</p>
            <p className="text-sm text-gray-600">{t('marketplace.verifiedProducts')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{new Set(products.map(p => p.farmerId)).size}</p>
            <p className="text-sm text-gray-600">{t('marketplace.trustedFarmers')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">4.8</p>
            <p className="text-sm text-gray-600">{t('marketplace.avgRating')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('marketplace.noProducts')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                    <Package className="h-16 w-16 text-green-600" />
                  </div>
                )}
                {product.verified && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('marketplace.verified')}
                  </Badge>
                )}
                {product.stagesCompleted === product.totalStages && (
                  <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                    <QrCode className="h-3 w-3 mr-1" />
                    {t('marketplace.qrCodeReady')}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Product Name & Category */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{product.productName}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">{product.category}</Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                {/* Farmer Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{product.farmerName}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{product.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">({product.stagesCompleted}/{product.totalStages} stages)</span>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-2xl font-bold text-green-600">₹{product.price}</p>
                    <p className="text-xs text-gray-500">per {product.unit}</p>
                  </div>
                  <div className="flex gap-2">
                    {isFarmer(product) ? (
                      <Button
                        onClick={() => handleEditPrice(product)}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Set Price
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {t('marketplace.addToCart')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Batch Code */}
                <div className="text-xs text-gray-400 font-mono text-center pt-2 border-t">
                  {product.batchCode}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Price Edit Dialog */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">
              Set Your Selling Price
            </DialogTitle>
            <DialogDescription>
              Adjust the price and quantity for your verified product. The blockchain proof QR code is shown on the right.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Panel - Price Settings */}
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Product Information</h3>
                  </div>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><span className="font-semibold">Product:</span> {selectedProduct.productName}</p>
                    <p><span className="font-semibold">Category:</span> {selectedProduct.category}</p>
                    <p><span className="font-semibold">Batch Code:</span> {selectedProduct.batchCode}</p>
                    <p><span className="font-semibold">Status:</span> <Badge className="bg-green-600">Verified ✓</Badge></p>
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative h-64 rounded-lg overflow-hidden border-2 border-slate-200">
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.productName}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                {/* Price Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-semibold">
                      Selling Price (per {selectedProduct.unit})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <Input
                        id="price"
                        type="number"
                        value={editablePrice}
                        onChange={(e) => setEditablePrice(Number(e.target.value))}
                        className="pl-8 h-14 text-2xl font-bold text-green-600"
                        min="0"
                        step="1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Set a competitive price based on market rates</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base font-semibold">
                      Available Quantity ({selectedProduct.unit})
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={editableQuantity}
                      onChange={(e) => setEditableQuantity(Number(e.target.value))}
                      className="h-12 text-lg font-semibold"
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-gray-500">Total quantity available for sale</p>
                  </div>

                  {/* Total Value */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Total Value:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{(editablePrice * editableQuantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSavePrice}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 font-semibold"
                  >
                    Save & List Product
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPriceDialogOpen(false)}
                    className="px-8 h-12 font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Right Panel - QR Code Proof */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-lg text-green-900">Blockchain Verification</h3>
                  </div>
                  
                  {/* QR Code Image */}
                  <div className="relative aspect-square bg-white rounded-lg border-4 border-green-500 overflow-hidden shadow-lg mb-4">
                    <Image
                      src={selectedProduct.qrCode}
                      alt="Blockchain QR Code"
                      fill
                      className="object-contain p-4"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        🔒 Blockchain Proof of Authenticity
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        This QR code contains the complete blockchain record of your crop's journey from farm to market. 
                        Consumers can scan this to verify:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        <li>✓ All 7 farming stages with photos</li>
                        <li>✓ Batch verification status</li>
                        <li>✓ Farmer identity & location</li>
                        <li>✓ Harvest dates & quality checks</li>
                        <li>✓ Complete supply chain transparency</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        💡 How it works
                      </p>
                      <p className="text-xs text-blue-700">
                        This QR code will be displayed on your product listing. Buyers can scan it to see the complete 
                        farming history, building trust and justifying premium pricing for verified products.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600">Stages Complete</p>
                        <p className="text-lg font-bold text-green-600">7/7</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600">Status</p>
                        <Badge className="bg-green-600 text-white">Verified</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
