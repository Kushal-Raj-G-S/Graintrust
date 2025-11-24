'use client';

import { useAuth } from '@/context/auth-context';
import { useTranslate } from '@/hooks/useTranslate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wheat, Shield, Users, GraduationCap, BarChart3, ArrowRight, CheckCircle, Star } from 'lucide-react';

interface HomePageProps {
  onRoleSelect: (role: 'farmer' | 'manufacturer' | 'consumer' | 'education' | 'admin') => void;
}

export function HomePage({ onRoleSelect }: HomePageProps): React.JSX.Element {
  const { t } = useTranslate();
  const { user } = useAuth();

  const allRoles = [
    {
      key: 'farmer' as const,
      title: t('home.roleSelection.farmer.title'),
      description: t('home.roleSelection.farmer.description'),
      icon: Wheat,
      color: 'bg-green-600 hover:bg-green-700',
      features: [
        t('home.roleSelection.farmer.features.createBatches'),
        t('home.roleSelection.farmer.features.trackTimeline'),
        t('home.roleSelection.farmer.features.generateQRCodes'),
        t('home.roleSelection.farmer.features.monitorProgress')
      ],
      users: t('home.roleSelection.farmer.subtitle')
    },
    {
      key: 'manufacturer' as const,
      title: 'Product Verification',
      description: 'Verify authenticity and track supply chain transparency for any product',
      icon: Shield,
      color: 'bg-blue-600 hover:bg-blue-700',
      features: ['Product batch management', 'Lab test integration', 'Quality certification', 'Compliance tracking'],
      users: '850+ manufacturers'
    },
    {
      key: 'consumer' as const,
      title: t('home.roleSelection.verification.title'),
      description: t('home.roleSelection.verification.description'),
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700',
      features: [
        t('home.roleSelection.verification.features.qrScanning'),
        t('home.roleSelection.verification.features.productVerification'),
        t('home.roleSelection.verification.features.supplyChainTracking'),
        t('home.roleSelection.verification.features.authenticityReports')
      ],
      users: t('home.roleSelection.verification.subtitle')
    },
    {
      key: 'education' as const,
      title: t('home.roleSelection.education.title'),
      description: t('home.roleSelection.education.description'),
      icon: GraduationCap,
      color: 'bg-orange-600 hover:bg-orange-700',
      features: [
        t('home.roleSelection.education.features.learningModules'),
        t('home.roleSelection.education.features.safetyGuidelines'),
        t('home.roleSelection.education.features.bestPractices'),
        t('home.roleSelection.education.features.interactiveGuides')
      ],
      users: t('home.roleSelection.education.subtitle')
    },
    {
      key: 'admin' as const,
      title: 'Admin',
      description: 'System administration and oversight',
      icon: BarChart3,
      color: 'bg-red-600 hover:bg-red-700',
      features: ['System analytics', 'Fraud management', 'Geographic insights', 'Reporting tools'],
      users: '150+ administrators'
    }
  ];

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const userRole = user?.role?.toLowerCase();

  // For logged-in users, show their role + education + consumer (available to all)
  // For non-logged-in users, show all roles for exploration
  const roles = !user 
    ? allRoles // Show all for non-logged-in users 
    : userRole === 'admin'
    ? allRoles // Admins can see everything
    : allRoles.filter(role => 
        role.key === userRole || role.key === 'education' || role.key === 'consumer' // Users see their role + education + consumer
      );

  const features = [
    {
      title: t('home.features.blockchain.title'),
      description: t('home.features.blockchain.description'),
      icon: Shield
    },
    {
      title: t('home.features.verification.title'),
      description: t('home.features.verification.description'),
      icon: CheckCircle
    },
    {
      title: t('home.features.fraud.title'),
      description: t('home.features.fraud.description'),
      icon: Star
    },
    {
      title: t('home.features.multilingual.title'),
      description: t('home.features.multilingual.description'),
      icon: Users
    }
  ];

  const stats = [
    { label: t('home.stats.productsTracked'), value: '2.1M+', color: 'text-green-600' },
    { label: t('home.stats.verifiedScans'), value: '12.8K+', color: 'text-blue-600' },
    { label: t('home.stats.fraudReports'), value: '47', color: 'text-red-600' },
    { label: t('home.stats.activeUsers'), value: '60K+', color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-2xl">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {t('home.hero.welcomeMessage')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-white/50 text-green-700 border-green-200 px-4 py-2">
              {t('home.hero.tagline')}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Selection */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home.roleSelection.title')}</h2>
            <p className="text-gray-600">{t('home.roleSelection.title')}</p>
          </div>

          {/* User Role Info Message */}
          {user && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {t('dashboard.welcome')}, {user.name}! ({user.role?.charAt(0).toUpperCase() + user.role?.slice(1)})
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {t('home.roleSelection.welcomeBack')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.key} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-xl ${role.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.title}</CardTitle>
                        <p className="text-xs text-gray-500">{role.users}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={() => onRoleSelect(role.key)}
                      className={`w-full gap-2 ${role.color} transition-all duration-200 group-hover:shadow-lg`}
                    >
                      {t('home.hero.getStarted')}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home.whyChoose.title')}</h2>
            <p className="text-gray-600">{t('home.whyChoose.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center space-y-4">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">{t('home.cta.title')}</h2>
            <p className="text-green-100 mb-6">
              {t('home.cta.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => onRoleSelect('farmer')}
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                {t('home.cta.startAsFarmer')}
              </Button>
              <Button 
                onClick={() => onRoleSelect('consumer')}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                {t('nav.productVerification')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
