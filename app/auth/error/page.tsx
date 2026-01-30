'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'UNAUTHORIZED_EMAIL':
        return {
          title: 'Email Not Authorized',
          message:
            'This email address is not authorized to access Chatita. Please contact support if you believe this is an error.',
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message:
            'There is a problem with the server configuration. Please contact support.',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message:
            'You do not have permission to sign in. Please contact support for access.',
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message:
            'The verification link is invalid or has expired. Please try signing in again.',
        };
      default:
        return {
          title: 'Authentication Error',
          message:
            'An error occurred during authentication. Please try again or contact support if the problem persists.',
        };
    }
  };

  const errorDetails = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-background p-4">
      <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-warning" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {errorDetails.title}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">{errorDetails.message}</p>

        {error && (
          <div className="bg-gray-100 rounded-lg p-4 text-sm text-left mb-8">
            <p className="font-medium text-gray-900 mb-1">Error Code:</p>
            <p className="text-gray-700 font-mono">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="inline-block w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>

          <a
            href="mailto:support@chatita.app"
            className="inline-block w-full border-2 border-gray-300 text-gray-700 py-3 rounded-button font-medium hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Additional info */}
        <p className="mt-6 text-xs text-gray-500">
          Need help? Email us at{' '}
          <a
            href="mailto:support@chatita.app"
            className="text-primary hover:underline"
          >
            support@chatita.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
