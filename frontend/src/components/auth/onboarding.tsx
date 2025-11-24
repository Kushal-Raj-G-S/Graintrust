'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Wheat, Building, MapPin, User, ArrowRight, ArrowLeft, CheckCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us about yourself and your role in agriculture',
    icon: User
  },
  {
    id: 'organization',
    title: 'Organization Details',
    description: 'Add information about your farm, company, or organization',
    icon: Building
  },
  {
    id: 'location',
    title: 'Location & Verification',
    description: 'Set your location and verify your identity',
    icon: MapPin
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'Welcome to GrainTrust - your account is ready',
    icon: CheckCircle
  }
];

export function Onboarding(): React.JSX.Element {
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    organization: '',
    organizationType: '',
    location: '',
    state: '',
    country: 'India',
    farmSize: '',
    specialization: '',
    experience: '',
    certifications: ''
  });

  const handleNext = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (): void => {
    // Pass the formData to completeOnboarding as expected by the auth context
    completeOnboarding(formData);
    toast.success('Welcome to GrainTrust! Your account is now complete.');
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStepContent = (): React.JSX.Element => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2">0-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="11-20">11-20 years</SelectItem>
                  <SelectItem value="20+">20+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your role in agriculture..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization Name</Label>
            <Input
              id="organization"
              placeholder="Your farm, company, or organization name"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type</Label>
              <Select value={formData.organizationType} onValueChange={(value) => setFormData({ ...formData, organizationType: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual-farm">Individual Farm</SelectItem>
                  <SelectItem value="cooperative">Cooperative</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="research">Research Institute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                placeholder="Organic farming, Seeds, Pesticides"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
          {user?.role === 'FARMER' && (
            <div className="space-y-2">
              <Label htmlFor="farmSize">Farm Size</Label>
              <Select value={formData.farmSize} onValueChange={(value) => setFormData({ ...formData, farmSize: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select farm size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (under 2 acres)</SelectItem>
                  <SelectItem value="medium">Medium (2-10 acres)</SelectItem>
                  <SelectItem value="large">Large (10-50 acres)</SelectItem>
                  <SelectItem value="commercial">Commercial (50+ acres)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">City/District</Label>
              <Input
                id="location"
                placeholder="Enter your city or district"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Enter your state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications (Optional)</Label>
            <Textarea
              id="certifications"
              placeholder="List any relevant certifications, licenses, or accreditations..."
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Identity Verification</h4>
            <p className="text-sm text-blue-800 mb-3">
              Upload documents to verify your identity and enhance trust in the platform.
            </p>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents (Optional)
            </Button>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-green-50 p-8 rounded-2xl border border-green-200">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Welcome to GrainTrust!</h3>
            <p className="text-green-800 mb-4">
              Your account is now set up and ready to use. You can start exploring the platform.
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Account Status:</span>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Next steps:</p>
            <ul className="mt-2 space-y-1">
              <li>• Explore your dashboard</li>
              <li>• Connect with other users</li>
              <li>• Start tracking your products</li>
            </ul>
          </div>
        </div>
      );
    }

    return <div>Unknown step</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-2xl">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GrainTrust Setup</h1>
              <p className="text-sm text-gray-500">Complete your profile to get started</p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                {React.createElement(steps[currentStep].icon, { className: 'h-6 w-6 text-green-600' })}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {steps[currentStep].description}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={stepVariants}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center gap-2"
              >
                Complete Setup
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
