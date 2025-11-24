'use client';

import { useState } from 'react';
import { SignIn } from './sign-in';
import { SignUp } from './sign-up';
import { ForgotPassword } from './forgot-password';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Shield, Leaf, Users, Award, TrendingUp } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export function AuthPage(): React.JSX.Element {
  const [mode, setMode] = useState<AuthMode>('signin');

  const features = [
    {
      icon: Shield,
      title: 'Secure Traceability',
      description: 'End-to-end tracking with blockchain-powered authentication'
    },
    {
      icon: Leaf,
      title: 'Sustainable Agriculture',
      description: 'Promoting eco-friendly farming practices and transparency'
    },
    {
      icon: Users,
      title: 'Community Trust',
      description: 'Building trust between farmers, manufacturers, and consumers'
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Ensuring authentic products through verified supply chains'
    },
    {
      icon: TrendingUp,
      title: 'Market Analytics',
      description: 'Real-time insights and fraud prevention analytics'
    }
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.3
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 flex">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-green-600 to-green-800 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <Wheat className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">GrainTrust</h1>
              <p className="text-green-100 text-lg">Agricultural Traceability Platform</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Revolutionizing Agriculture Through Technology
              </h2>
              <p className="text-green-100 leading-relaxed">
                Join thousands of farmers, manufacturers, and consumers who trust GrainTrust 
                to ensure agricultural product authenticity and promote sustainable farming practices.
              </p>
            </div>

            <div className="grid gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm"
                  >
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-green-100 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Right Panel - Authentication */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              {mode === 'signin' && (
                <SignIn
                  onToggleMode={() => setMode('signup')}
                  onForgotPassword={() => setMode('forgot-password')}
                />
              )}
              {mode === 'signup' && (
                <SignUp onToggleMode={() => setMode('signin')} />
              )}
              {mode === 'forgot-password' && (
                <ForgotPassword onBackToSignIn={() => setMode('signin')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
