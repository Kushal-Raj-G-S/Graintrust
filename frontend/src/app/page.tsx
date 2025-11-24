'use client'

import { useAuth } from '@/context/auth-context'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// Import Components
import { AuthPage } from '@/components/auth/auth-page'
import { Onboarding } from '@/components/auth/onboarding'
import { Header } from '@/components/layout/header'
import { HomePage } from '@/components/home/home-page'
import { FarmerDashboard } from '@/components/farmer/farmer-dashboard'
import { FarmerDashboardAdmin } from '@/components/farmer/farmer-dashboard-admin'
import { ManufacturerDashboard } from '@/components/manufacture/manufacturer-dashboard'
import { ConsumerDashboard } from '@/components/consumer/consumer-dashboard'
import { EducationCenter } from '@/components/education/education-center'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { UserProfile } from '@/components/auth/user-profile'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<string>('home')

  // No automatic redirection - users can navigate freely to any page
  // Removed useEffect for auto-redirect behavior

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading GrainTrust...</p>
        </motion.div>
      </div>
    )
  }

  // Not authenticated - show auth page
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // User needs onboarding
  if (user && !user.onboardingComplete) {
    return <Onboarding />
  }

  // Main application with navigation
  const handleRoleSelect = (role: 'farmer' | 'manufacturer' | 'consumer' | 'education' | 'admin') => {
    // Role-based access control - updated to allow consumer access for everyone
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === 'admin';
    
    // Admins can access everything
    if (isAdmin) {
      setCurrentView(role);
      return;
    }
    
    // Education and Consumer dashboards are available to everyone
    if (role === 'education' || role === 'consumer') {
      setCurrentView(role);
      return;
    }
    
    // Users can only access their own role dashboard (farmer/manufacturer)
    if (role === userRole) {
      setCurrentView(role);
      return;
    }
    
    // Unauthorized access - stay on home
    console.warn(`User ${userRole} attempted to access ${role} dashboard`);
    setCurrentView('home');
  }

  const handleRoleChange = (role: 'farmer' | 'manufacturer' | 'consumer' | 'education' | 'admin' | null) => {
    if (role) {
      handleRoleSelect(role); // Use the same access control logic
    } else {
      setCurrentView('home');
    }
  }

  const handleProfileClose = () => {
    setCurrentView('home')
  }

  // Role-based access helper function
  const hasAccessToView = (view: string): boolean => {
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === 'admin';
    
    // Everyone can access home, education, consumer, and profile
    if (view === 'home' || view === 'education' || view === 'consumer' || view === 'profile') {
      return true;
    }
    
    // Admins can access everything
    if (isAdmin) {
      return true;
    }
    
    // Users can only access their own role dashboard
    return view === userRole;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentRole={currentView === 'home' ? null : currentView as 'farmer' | 'manufacturer' | 'consumer' | 'education' | 'admin'} 
        onRoleChange={handleRoleChange} 
      />
      
      <main className="pt-4">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {currentView === 'home' && <HomePage onRoleSelect={handleRoleSelect} />}
          {currentView === 'farmer' && hasAccessToView('farmer') && (
            (() => {
              const isAdmin = user?.role?.toLowerCase() === 'admin';
              
              if (isAdmin) {
                return <FarmerDashboardAdmin />;
              } else {
                return <FarmerDashboard />;
              }
            })()
          )}
          {currentView === 'manufacturer' && hasAccessToView('manufacturer') && <ManufacturerDashboard />}
          {currentView === 'consumer' && hasAccessToView('consumer') && <ConsumerDashboard />}
          {currentView === 'education' && <EducationCenter />}
          {currentView === 'admin' && hasAccessToView('admin') && <AdminDashboard />}
          {currentView === 'profile' && <UserProfile onClose={handleProfileClose} />}
          
          {/* Unauthorized Access Message */}
          {!hasAccessToView(currentView) && currentView !== 'home' && (
            <div className="container mx-auto px-4 py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-8 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.464 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
                  <p className="text-red-700 mb-4">
                    You don't have permission to access the {currentView} dashboard.
                  </p>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}