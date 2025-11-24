'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, Eye, Download, AlertTriangle, CheckCircle, Package, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { mockManufacturerBatches, type Batch } from '@/lib/mock-data';
import { QRGenerator } from '@/components/shared/qr-generator';
import { format } from 'date-fns';

interface CreateProductFormData {
  name: string;
  category: string;
  quantity: string;
  expiryDate: string;
  description: string;
  labTest: File | null;
}

export function ManufacturerDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Batch[]>(mockManufacturerBatches);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Batch | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateProductFormData>({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
    description: '',
    labTest: null
  });

  const productCategories = [
    'Pesticides', 'Seeds', 'Fertilizers', 'Equipment', 'Fungicides', 'Herbicides', 'Other'
  ];

  const handleCreateProduct = (): void => {
    if (!formData.name || !formData.category || !formData.quantity || !formData.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProduct: Batch = {
      id: 'MB' + String(products.length + 1).padStart(3, '0'),
      type: 'product',
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      expiryDate: new Date(formData.expiryDate),
      status: 'active',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MB${String(products.length + 1).padStart(3, '0')}`,
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
      location: {
        lat: 19.0760 + (Math.random() - 0.5) * 0.1,
        lng: 72.8777 + (Math.random() - 0.5) * 0.1,
        address: 'Manufacturing Unit, India'
      },
      manufacturer: {
        name: 'Current Manufacturer',
        id: 'M' + String(products.length + 1).padStart(3, '0'),
        license: 'LIC-2024-' + String(products.length + 1).padStart(3, '0')
      },
      labTest: formData.labTest ? {
        url: 'https://example.com/lab-report.pdf',
        passed: true,
        date: new Date()
      } : undefined,
      timeline: [
        {
          date: new Date(),
          event: 'Production Started',
          description: `${formData.name} production batch initialized`
        },
        {
          date: new Date(),
          event: 'Quality Check',
          description: 'Internal quality control in progress'
        }
      ],
      fraudReports: 0,
      verified: false,
      createdAt: new Date()
    };

    setProducts([...products, newProduct]);
    setFormData({
      name: '',
      category: '',
      quantity: '',
      expiryDate: '',
      description: '',
      labTest: null
    });
    setIsCreateDialogOpen(false);
    toast.success('Product batch created successfully!');
  };

  const handleViewProduct = (product: Batch): void => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fraudulent': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    verifiedProducts: products.filter(p => p.verified).length,
    suspiciousProducts: products.filter(p => p.status === 'suspicious').length
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight mb-1">
            Manufacturer Dashboard
          </h1>
          <p className="text-sm text-slate-600 font-medium">Manage your product batches and certifications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              {t('createProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createProduct')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">{t('productName')}</Label>
                  <Input
                    id="product-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., OrganicGrow Pesticide"
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">{t('productType')}</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">{t('batchSize')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry-date">{t('expiryDate')}</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional product details..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="lab-test">{t('labTest')}</Label>
                <Input
                  id="lab-test"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({...formData, labTest: e.target.files?.[0] || null})}
                />
              </div>
              <Button onClick={handleCreateProduct} className="w-full">
                {t('create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{stats.verifiedProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Factory className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suspicious</p>
                <p className="text-2xl font-bold">{stats.suspiciousProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
              Product Batches
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(product.status)}
                        <span className="text-sm text-gray-600 capitalize">{product.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Quantity:</span> {product.quantity} units
                      </div>
                      <div>
                        <span className="font-medium">Expiry:</span> {product.expiryDate && format(product.expiryDate, 'MMM dd, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Lab Test:</span> {product.labTest?.passed ? 'Passed' : 'Pending'}
                      </div>
                    </div>
                    {product.fraudReports > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            {product.fraudReports} fraud report(s) received
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProduct(product)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      {t('view')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Product Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">ID:</span> {selectedProduct.id}</div>
                      <div><span className="font-medium">Category:</span> {selectedProduct.category}</div>
                      <div><span className="font-medium">Quantity:</span> {selectedProduct.quantity} units</div>
                      <div><span className="font-medium">Expiry:</span> {selectedProduct.expiryDate && format(selectedProduct.expiryDate, 'PPP')}</div>
                      <div><span className="font-medium">Status:</span> 
                        <Badge variant="outline" className="ml-2">{selectedProduct.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Manufacturer</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedProduct.manufacturer?.name}</div>
                      <div><span className="font-medium">License:</span> {selectedProduct.manufacturer?.license}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Lab Test</h4>
                    {selectedProduct.labTest ? (
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Status:</span> 
                          <Badge variant={selectedProduct.labTest.passed ? "default" : "destructive"} className="ml-2">
                            {selectedProduct.labTest.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <div><span className="font-medium">Date:</span> {format(selectedProduct.labTest.date, 'PPP')}</div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          Download Report
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No lab test report available</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <QRGenerator
                    data={selectedProduct.id}
                    title={`${selectedProduct.name} QR Code`}
                    size={200}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
