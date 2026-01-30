// API route protection helpers

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { NextResponse } from 'next/server';

/**
 * Requires authentication for API routes
 * Returns user if authenticated, or error response if not
 *
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const { user, response: authResponse } = await requireAuth();
 *   if (authResponse) return authResponse;
 *
 *   // User is authenticated, proceed with logic
 *   // user.id, user.email, user.name are available
 * }
 * ```
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  const user = session?.user || null;

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * Gets the current authenticated user without requiring auth
 * Returns null if not authenticated
 *
 * Usage:
 * ```typescript
 * export async function GET(request: Request) {
 *   const user = await getCurrentUser();
 *   if (!user) {
 *     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
 *   }
 *   // ...
 * }
 * ```
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Validates that a resource belongs to the authenticated user
 *
 * @param resourceUserId - The userId associated with the resource
 * @param authenticatedUserId - The currently authenticated user's ID
 * @returns true if authorized, false otherwise
 */
export function isResourceOwner(
  resourceUserId: string,
  authenticatedUserId: string
): boolean {
  return resourceUserId === authenticatedUserId;
}

/**
 * Creates a standardized unauthorized response
 */
export function unauthorizedResponse(message?: string) {
  return NextResponse.json(
    { error: message || 'Unauthorized access' },
    { status: 403 }
  );
}

/**
 * Creates a standardized not found response
 */
export function notFoundResponse(message?: string) {
  return NextResponse.json(
    { error: message || 'Resource not found' },
    { status: 404 }
  );
}
