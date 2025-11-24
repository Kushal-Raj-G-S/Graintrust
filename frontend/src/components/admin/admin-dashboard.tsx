'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Users, 
  Package, 
  Eye, 
  Flag, 
  MapPin, 
  Calendar,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles
} from 'lucide-react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { mockAnalyticsData, mockFraudReports, type FraudReport } from '@/lib/mock-data';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
);

export function AdminDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
  const [fraudReports] = useState<FraudReport[]>(mockFraudReports);

  const handleViewReport = (report: FraudReport): void => {
    setSelectedReport(report);
    setIsReportDialogOpen(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Chart data
  const scanTrendsData = {
    labels: mockAnalyticsData.recentScans.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Daily Scans',
        data: mockAnalyticsData.recentScans.map(item => item.count),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const fraudTrendsData = {
    labels: mockAnalyticsData.fraudTrends.map(item => item.month),
    datasets: [
      {
        label: 'Fraud Reports',
        data: mockAnalyticsData.fraudTrends.map(item => item.reports),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'Confirmed',
        data: mockAnalyticsData.fraudTrends.map(item => item.confirmed),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
      },
    ],
  };

  const batchDistributionData = {
    labels: mockAnalyticsData.batchDistribution.map(item => item.category),
    datasets: [
      {
        data: mockAnalyticsData.batchDistribution.map(item => item.count),
        backgroundColor: mockAnalyticsData.batchDistribution.map(item => item.color),
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent tracking-tight mb-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600 font-medium">Monitor system analytics and fraud prevention</p>
          </div>
        </div>
        
        {/* AI Validation Dashboard Button */}
        <Button
          onClick={() => router.push('/admin/ai-validation')}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Brain className="h-4 w-4" />
          AI Validation Dashboard
          <Sparkles className="h-3 w-3" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('totalScans')}</p>
                <p className="text-2xl font-bold">{mockAnalyticsData.totalScans.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('totalBatches')}</p>
                <p className="text-2xl font-bold">{mockAnalyticsData.totalBatches.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verifiedProducts')}</p>
                <p className="text-2xl font-bold">{mockAnalyticsData.verifiedProducts.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('fraudReports')}</p>
                <p className="text-2xl font-bold">{mockAnalyticsData.fraudReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fraud-management">Fraud Management</TabsTrigger>
          <TabsTrigger value="locations">Geographic Data</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Scan Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={scanTrendsData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Fraud Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={fraudTrendsData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Batch Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={batchDistributionData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Scanning Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalyticsData.topLocations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{location.location}</p>
                          <p className="text-sm text-gray-500">{location.scans} scans</p>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fraud-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Fraud Reports Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{report.productName}</h3>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(report.priority)}`} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(report.reportedAt, 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {report.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {report.reporterName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {report.reportType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {report.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Scan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Top Scanning Locations</h3>
                  <div className="space-y-3">
                    {mockAnalyticsData.topLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{location.location}</p>
                            <p className="text-sm text-gray-500">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{location.scans}</p>
                          <p className="text-sm text-gray-500">scans</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Scan Heatmap</h3>
                  <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Geographic heatmap visualization</p>
                      <p className="text-sm text-gray-500">Interactive map would be implemented here</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fraud Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Report Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Report ID:</span> {selectedReport.id}</div>
                    <div><span className="font-medium">Product:</span> {selectedReport.productName}</div>
                    <div><span className="font-medium">Batch ID:</span> {selectedReport.batchId}</div>
                    <div><span className="font-medium">Type:</span> 
                      <Badge variant="outline" className="ml-2">{selectedReport.reportType}</Badge>
                    </div>
                    <div><span className="font-medium">Priority:</span> 
                      <Badge variant="outline" className="ml-2">{selectedReport.priority}</Badge>
                    </div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Reporter Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedReport.reporterName}</div>
                    <div><span className="font-medium">Phone:</span> {selectedReport.reporterPhone}</div>
                    <div><span className="font-medium">Location:</span> {selectedReport.location}</div>
                    <div><span className="font-medium">Reported:</span> {format(selectedReport.reportedAt, 'PPP')}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedReport.description}</p>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Confirmed
                </Button>
                <Button variant="outline" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Dismiss Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
