// Route protection middleware

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/access-denied',
  '/api/auth', // NextAuth API routes
  '/api/register', // Registration endpoint
];

// SECURITY LAYER 5: Middleware protects all routes except public ones
export default withAuth(
  function middleware(req) {
    // Allow request to proceed if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes without authentication
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        // All other routes require authentication
        const isAuthorized = !!token;

        if (!isAuthorized) {
          console.log(`🚫 Unauthenticated access attempt to: ${pathname}`);
        }

        return isAuthorized;
      },
    },
    pages: {
      signIn: '/login',
      error: '/auth/error',
    },
  }
);

// Configure which routes use this middleware
// Excludes static files, images, and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
