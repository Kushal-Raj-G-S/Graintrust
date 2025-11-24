'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Brain, 
  TrendingUp,
  RefreshCw,
  Eye,
  Shield,
  QrCode
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import QRCode from 'qrcode';

interface ValidationStats {
  totalValidations: number;
  autoApproved: number;
  autoRejected: number;
  flaggedForHuman: number;
  averageDeepfakeScore: number;
  deepfakesDetected: number;
}

interface VerifiedStats {
  totalVerified: number;
  aiAutoApproved: number;
  expertApproved: number;
}

interface Validation {
  id: string;
  batchId: string;
  stageId: string;
  imageUrl: string;
  imageHash: string;
  formatValid: boolean;
  integrityValid: boolean;
  deepfakeScore: number;
  visualSenseScore: number;
  aiAction: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'FLAG_FOR_HUMAN';
  aiReason: string;
  aiRequiresHumanReview: boolean;
  aiModel: string;
  validatedAt: string;
  raw_uploads: {
    farmerId: string;
    fileSize: number;
  }[];
}

interface PendingReview {
  id: string;
  batchId: string;
  imageUrl: string;
  decision: string;
  assignedAt: string;
  ai_validations: {
    deepfakeScore: number;
    visualSenseScore: number;
    aiReason: string;
  }[];
}

interface FarmerBatchData {
  farmerId: string;
  farmerName: string;
  farmerEmail: string;
  batches: {
    batchId: string;
    batchName: string;
    flaggedImages: number;
    autoRejected: number;
    flaggedForReview: number;
    validations: any[];
    qrCodeUrl?: string;
    certificateId?: string;
  }[];
}

export function AIValidationDashboard() {
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [verifiedStats, setVerifiedStats] = useState<VerifiedStats | null>(null);
  const [recentValidations, setRecentValidations] = useState<Validation[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [farmerBatchData, setFarmerBatchData] = useState<FarmerBatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qrCodeImages, setQrCodeImages] = useState<{ [batchId: string]: string }>({});

  // Generate QR code image from URL
  const generateQRCodeImage = async (url: string, batchId: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeImages(prev => ({ ...prev, [batchId]: qrDataURL }));
    } catch (error) {
      console.error('QR code generation failed for batch', batchId, error);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/validation-stats?limit=20');
      const data = await response.json();
      
      setStats(data.stats);
      setVerifiedStats(data.verifiedStats);
      setRecentValidations(data.recentValidations || []);
      setPendingReviews(data.pendingReviews || []);
      setFarmerBatchData(data.farmerBatchData || []);
    } catch (error) {
      console.error('Error fetching AI validation stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'AUTO_APPROVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'AUTO_REJECT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'FLAG_FOR_HUMAN':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDeepfakeColor = (score: number) => {
    if (score > 0.7) return 'text-red-600 font-bold';
    if (score > 0.4) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading AI validation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
              AI Validation Dashboard
            </h1>
            <p className="text-gray-600">Real-time AI image fraud detection & validation</p>
          </div>
        </div>
        <Button onClick={fetchStats} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.totalValidations || 0}</div>
            <p className="text-xs text-blue-600 mt-1">Images processed by AI</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Auto-Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.autoApproved || 0}</div>
            <p className="text-xs text-green-600 mt-1">
              {stats?.totalValidations ? Math.round((stats.autoApproved / stats.totalValidations) * 100) : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Fake Images Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats?.deepfakesDetected || 0}</div>
            <p className="text-xs text-red-600 mt-1">AI-generated/fake images detected</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{pendingReviews.length}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting human expert</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Fake Image Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getDeepfakeColor(stats?.averageDeepfakeScore || 0)}`}>
                  {((stats?.averageDeepfakeScore || 0) * 100).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">(lower is better)</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Blockchain-Ready Images</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {verifiedStats?.totalVerified || 0}
                </span>
                <span className="text-sm text-gray-500">verified</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">AI Model</p>
              <div className="text-sm font-semibold text-blue-600">
                Hugging Face AI Image Detector
              </div>
              <div className="text-xs text-gray-500 mt-1">Multi-model validation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle>Farmer Profiles - Flagged Batches</CardTitle>
          <CardDescription>
            Farmers and batches with suspicious/flagged images. 
            <span className="font-semibold text-green-600"> If a farmer/batch is not shown, all their images passed AI validation!</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {farmerBatchData.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-green-300 mx-auto mb-3" />
                <p className="text-green-600 font-semibold text-lg">✅ All farmers' images passed AI validation!</p>
                <p className="text-gray-500 text-sm mt-2">No suspicious or flagged images detected</p>
              </div>
            ) : (
              <div className="space-y-6">
                {farmerBatchData.map((farmer) => (
                  <div
                    key={farmer.farmerId}
                    className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50/30"
                  >
                    {/* Farmer Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {farmer.farmerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{farmer.farmerName}</h3>
                        <p className="text-sm text-gray-600">{farmer.farmerEmail}</p>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        {farmer.batches.length} batch{farmer.batches.length !== 1 ? 'es' : ''} flagged
                      </Badge>
                    </div>

                    {/* Farmer's Batches */}
                    <div className="space-y-3">
                      {farmer.batches.map((batch) => (
                        <div
                          key={batch.batchId}
                          className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{batch.batchName}</h4>
                              <p className="text-xs text-gray-500">Batch ID: {batch.batchId.substring(0, 12)}...</p>
                            </div>
                            <div className="flex gap-2">
                              {batch.autoRejected > 0 && (
                                <Badge className="bg-red-100 text-red-800 border-red-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {batch.autoRejected} Rejected
                                </Badge>
                              )}
                              {batch.flaggedForReview > 0 && (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {batch.flaggedForReview} Review
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Batch Validations */}
                          <div className="space-y-2">
                            {batch.validations.slice(0, 3).map((validation: any) => (
                              <div
                                key={validation.id}
                                className="flex gap-3 p-2 bg-gray-50 rounded-lg"
                              >
                                <div 
                                  className="relative w-16 h-16 bg-gray-200 rounded cursor-pointer flex-shrink-0"
                                  onClick={() => setSelectedImage(validation.imageUrl)}
                                >
                                  <Image
                                    src={validation.imageUrl}
                                    alt="Flagged image"
                                    fill
                                    className="object-cover rounded"
                                    unoptimized
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={`text-xs ${getActionColor(validation.aiAction)}`}>
                                      {validation.aiAction.replace('_', ' ')}
                                    </Badge>
                                    <span className={`text-sm font-bold ${getDeepfakeColor(validation.deepfakeScore)}`}>
                                      {(validation.deepfakeScore * 100).toFixed(1)}% fake
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2">{validation.aiReason}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(validation.validatedAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {batch.validations.length > 3 && (
                              <p className="text-xs text-gray-500 text-center py-1">
                                +{batch.validations.length - 3} more flagged images
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="Full size preview"
              width={1200}
              height={800}
              className="object-contain"
              unoptimized
            />
            <Button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4"
              variant="destructive"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
