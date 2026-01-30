'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldX } from 'lucide-react';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-background p-4">
      <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-danger" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        {/* Message */}
        <div className="space-y-4 text-gray-600 mb-8">
          <p>
            Chatita is currently restricted to authorized users only.
          </p>

          {email && (
            <div className="bg-gray-100 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-900 mb-1">
                Email address:
              </p>
              <p className="text-gray-700 break-all">{email}</p>
            </div>
          )}

          <p>
            This application requires an invitation to access. If you believe
            you should have access, please contact the administrator.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <p className="font-medium text-primary mb-1">
              Need access?
            </p>
            <p className="text-gray-700">
              Contact:{' '}
              <a
                href="mailto:support@chatita.app"
                className="text-primary font-medium hover:underline"
              >
                support@chatita.app
              </a>
            </p>
          </div>
        </div>

        {/* Back to sign in */}
        <Link
          href="/login"
          className="inline-block w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Sign In
        </Link>

        {/* Additional info */}
        <p className="mt-6 text-xs text-gray-500">
          Chatita is a private diabetes management companion. Access is granted
          on an individual basis.
        </p>
      </div>
    </div>
  );
}
