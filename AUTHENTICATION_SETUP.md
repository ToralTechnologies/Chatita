# 🔒 Authentication & Access Control Setup

## Overview

Chatita implements **enterprise-level access control** using an email allowlist system.

### Key Features

- ✅ **Email Allowlist**: Only authorized emails can access the app
- ✅ **5-Layer Security**: Multiple validation checkpoints
- ✅ **Secure by Default**: Empty allowlist = NO access
- ✅ **OAuth Support**: Optional Google OAuth integration
- ✅ **Session Validation**: Real-time access control
- ✅ **Route Protection**: Middleware guards all protected routes
- ✅ **API Protection**: Helper functions for API route security

---

## Quick Start

### 1. Add Authorized Emails

Edit `.env` and add comma-separated emails:

```bash
# REQUIRED: Add your authorized emails
ALLOWED_EMAILS="your-email@example.com,teammate@example.com"
```

**Important:**
- No spaces between emails
- Use commas only
- Emails are case-insensitive
- If empty, **ALL access is blocked**

### 2. Restart Server

```bash
# Restart to apply changes
npm run dev
```

### 3. Test Access

1. **Try to register with unauthorized email** → Should see "Email not authorized" error
2. **Register with authorized email** → Should work normally
3. **Remove email from allowlist** → User loses access immediately

---

## Security Architecture

### 5 Layers of Security

#### **Layer 1: Registration Validation**
- File: `app/api/register/route.ts`
- Checks `isEmailAllowed()` before creating account
- Returns 403 error if unauthorized
- Prevents account creation for non-allowlisted emails

#### **Layer 2: Credentials Sign-In**
- File: `lib/auth.ts` - CredentialsProvider
- Validates allowlist BEFORE checking password
- Throws `UNAUTHORIZED_EMAIL` error if not allowed
- Redirects to `/auth/access-denied`

#### **Layer 3: OAuth Sign-In**
- File: `lib/auth.ts` - signIn callback
- Validates email during OAuth flow
- Works with Google OAuth provider
- Redirects with error message if unauthorized

#### **Layer 4: Session Validation**
- File: `lib/auth.ts` - session callback
- Re-validates allowlist on EVERY session request
- Invalidates session if user removed from allowlist
- Ensures real-time access control

#### **Layer 5: Route Middleware**
- File: `middleware.ts`
- Protects all routes except public ones
- Uses NextAuth's `withAuth` middleware
- Redirects to `/login` if not authenticated

---

## Implementation Details

### Email Allowlist Utility

**File:** `lib/utils/allowlist.ts`

```typescript
// Get all allowed emails
const emails = getAllowedEmails();
// Returns: ['user1@example.com', 'user2@example.com']

// Check if email is allowed
const allowed = isEmailAllowed('user@example.com');
// Returns: true or false

// Get formatted list
const formatted = getFormattedAllowedEmails();
// Returns: "user1@example.com, user2@example.com"
```

### Database Schema Updates

**New Models Added:**

1. **Account** - OAuth provider accounts
2. **Session** - NextAuth sessions
3. **VerificationToken** - Email verification tokens

**User Model Updates:**

- `password` is now optional (for OAuth users)
- Added `emailVerified` field
- Added `image` field for profile pictures
- Added relations to `accounts` and `sessions`

### API Route Protection

**File:** `lib/utils/auth-helpers.ts`

```typescript
// Require authentication
export async function POST(request: Request) {
  const { user, response: authResponse } = await requireAuth();
  if (authResponse) return authResponse;

  // User is authenticated - proceed with logic
  console.log(user.id, user.email, user.name);
}

// Get current user (optional auth)
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // ...
}
```

### Protected Routes

**Middleware Configuration:**

All routes are protected **except**:

- `/` - Landing page
- `/login` - Sign in
- `/register` - Sign up
- `/auth/*` - Auth pages
- `/api/auth/*` - NextAuth API
- `/api/register` - Registration endpoint
- Static files (images, etc.)

### Custom Error Pages

**Access Denied:** `/auth/access-denied`
- Shown when unauthorized email attempts access
- Displays contact information
- Shows attempted email address
- Link to sign in page

**Authentication Error:** `/auth/error`
- Handles various auth errors
- Shows error-specific messages
- Provides retry and contact options
- Error code displayed for debugging

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="your-secret"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Access Control (REQUIRED)
ALLOWED_EMAILS="user1@example.com,user2@example.com"
```

### Optional

```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Google OAuth Setup (Optional)

### 1. Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 2. Add Credentials to .env

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. Restart Server

```bash
npm run dev
```

The "Sign in with Google" option will now appear on the login page.

---

## Testing Checklist

### ✅ Registration Tests

- [ ] Unauthorized email registration → Blocked with 403
- [ ] Authorized email registration → Success
- [ ] Empty password → Validation error
- [ ] Password < 8 characters → Validation error
- [ ] Existing email → "User already exists" error

### ✅ Sign-In Tests

- [ ] Unauthorized email + correct password → Access denied
- [ ] Authorized email + correct password → Success
- [ ] Authorized email + wrong password → Invalid credentials
- [ ] OAuth with unauthorized email → Redirects to access denied
- [ ] OAuth with authorized email → Success

### ✅ Session Tests

- [ ] User removed from allowlist → Session invalidated
- [ ] User re-added to allowlist → Can sign in again
- [ ] Session persists for 30 days → Still authenticated
- [ ] Sign out → Session cleared

### ✅ Route Protection Tests

- [ ] Unauthenticated access to `/home` → Redirects to `/login`
- [ ] Authenticated access to `/home` → Success
- [ ] Access to `/login` while authenticated → Allowed
- [ ] Static files accessible → Success

### ✅ API Protection Tests

- [ ] API call without auth → 401 Unauthorized
- [ ] API call with valid session → Success
- [ ] User tries to access another user's data → 403 Forbidden

---

## Security Best Practices

### ✅ Implemented

1. **Secure by Default**
   - Empty allowlist blocks all access
   - No implicit access granted

2. **Password Security**
   - bcrypt with 12 rounds
   - Minimum 8 characters required
   - Passwords hashed before storage

3. **Session Security**
   - JWT-based sessions
   - 30-day expiration
   - HTTP-only cookies
   - CSRF protection (NextAuth)

4. **Real-Time Access Control**
   - Session re-validated on every request
   - Users lose access immediately when removed

5. **OAuth Security**
   - Email validation during OAuth flow
   - Provider account linking
   - Secure token storage

### 🔒 Additional Recommendations

1. **Production Secrets**
   ```bash
   # Generate new secret for production
   openssl rand -base64 32
   ```

2. **HTTPS in Production**
   ```bash
   NEXTAUTH_URL="https://your-domain.com"
   ```

3. **Rate Limiting** (Future)
   - Limit login attempts
   - Prevent brute force attacks

4. **Email Verification** (Future)
   - Verify email ownership
   - Send verification links

5. **Password Reset** (Future)
   - Secure reset flow
   - Token-based reset

---

## Troubleshooting

### "ALLOWED_EMAILS is empty - blocking all access"

**Problem:** No emails in allowlist
**Solution:** Add emails to `.env`:

```bash
ALLOWED_EMAILS="your-email@example.com"
```

### "This email is not authorized to sign up"

**Problem:** Email not in allowlist
**Solution:** Add email to `ALLOWED_EMAILS` in `.env`

### "Your access has been revoked"

**Problem:** User was removed from allowlist while signed in
**Solution:** Re-add email to allowlist or contact admin

### Middleware causing redirect loops

**Problem:** Public routes not configured correctly
**Solution:** Check `middleware.ts` public routes array

### OAuth not working

**Problem:** Missing Google credentials or incorrect callback URL
**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Check callback URL in Google Console matches: `http://localhost:3000/api/auth/callback/google`

---

## Production Deployment

### Vercel Setup

1. **Add Environment Variables in Vercel Dashboard:**

```bash
DATABASE_URL=<your-production-database-url>
NEXTAUTH_SECRET=<generate-new-production-secret>
NEXTAUTH_URL=https://your-domain.vercel.app
ALLOWED_EMAILS=user1@example.com,user2@example.com
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

2. **Update Google OAuth Redirect URI:**
   - Add: `https://your-domain.vercel.app/api/auth/callback/google`

3. **Deploy:**

```bash
vercel --prod
```

---

## Managing Access

### Add User

1. Update `.env`:

```bash
ALLOWED_EMAILS="existing@example.com,new-user@example.com"
```

2. Restart server (dev) or redeploy (production)
3. New user can now register/sign in

### Remove User

1. Update `.env`:

```bash
# Remove email from list
ALLOWED_EMAILS="user1@example.com"
```

2. Restart/redeploy
3. User loses access immediately (even if currently signed in)

### Check Who Has Access

```bash
# View current allowlist
cat .env | grep ALLOWED_EMAILS
```

---

## Example Workflows

### New User Onboarding

1. **Admin adds email to allowlist**
   ```bash
   ALLOWED_EMAILS="existing@example.com,newuser@example.com"
   ```

2. **Notify user** they can register

3. **User visits** `https://chatita.app/register`

4. **User registers** with authorized email

5. **User completes** onboarding flow

### Removing Access

1. **Admin removes email from allowlist**
   ```bash
   ALLOWED_EMAILS="user1@example.com"
   # (removed user2@example.com)
   ```

2. **Redeploy** to production

3. **User2's session invalidated** on next request

4. **User2 sees** "Your access has been revoked" message

---

## Code Examples

### Check Access in Server Component

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/protected-page');
  }

  // User is authenticated and authorized
  return <div>Welcome, {session.user.name}!</div>;
}
```

### Protected API Route

```typescript
import { requireAuth } from '@/lib/utils/auth-helpers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  // Require authentication
  const { user, response: authResponse } = await requireAuth();
  if (authResponse) return authResponse;

  // Get request data
  const body = await request.json();

  // Create resource owned by authenticated user
  const resource = await prisma.meal.create({
    data: {
      ...body,
      userId: user!.id, // Link to authenticated user
    },
  });

  return NextResponse.json(resource);
}
```

### Check Resource Ownership

```typescript
import { requireAuth, isResourceOwner, notFoundResponse, unauthorizedResponse } from '@/lib/utils/auth-helpers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const { user, response: authResponse } = await requireAuth();
  if (authResponse) return authResponse;

  // Find resource
  const meal = await prisma.meal.findUnique({
    where: { id: params.id },
  });

  if (!meal) {
    return notFoundResponse('Meal not found');
  }

  // Verify ownership
  if (!isResourceOwner(meal.userId, user!.id)) {
    return unauthorizedResponse('You can only delete your own meals');
  }

  // Delete resource
  await prisma.meal.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
```

---

## Resources

- **NextAuth.js Docs**: https://next-auth.js.org/
- **Prisma Adapter**: https://authjs.dev/reference/adapter/prisma
- **Google OAuth Setup**: https://console.cloud.google.com/

---

## Summary

Chatita now has **enterprise-level access control** with:

- ✅ Email allowlist for restricted access
- ✅ 5 layers of security validation
- ✅ Real-time session invalidation
- ✅ OAuth support (Google)
- ✅ Protected routes and API endpoints
- ✅ User-friendly error pages
- ✅ Production-ready security

**Status**: Fully implemented and ready for use

**Cost**: $0 (no additional services required)

**Setup Time**: 5 minutes (just add emails to `.env`)

---

**Built with security in mind** 🔒
