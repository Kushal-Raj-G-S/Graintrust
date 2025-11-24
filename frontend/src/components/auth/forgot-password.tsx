'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wheat, Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToSignIn: () => void;
}

export function ForgotPassword({ onBackToSignIn }: ForgotPasswordProps): React.JSX.Element {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const result = await resetPassword(email);
    if (result) {
      setSuccess(true);
    } else {
      setError('Failed to send reset email. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
            <CardDescription className="text-gray-600">
              We&apos;ve sent password reset instructions to your email
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">Reset Email Sent!</p>
                <p className="text-green-700 text-sm mt-1">
                  Check your inbox and click the reset link to create a new password.
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p>{"Didn't receive the email?"}</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes and try again</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                variant="outline"
                className="w-full h-12 border-green-200 text-green-700 hover:bg-green-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                    Resending...
                  </div>
                ) : (
                  'Resend Reset Email'
                )}
              </Button>

              <Button
                onClick={onBackToSignIn}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:text-gray-800 hover:bg-gray-50 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-2xl">
              <Wheat className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Sending Reset Email...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Send Reset Email
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToSignIn}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
