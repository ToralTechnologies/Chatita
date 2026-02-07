# Dexcom CGM Integration Setup Guide

This guide explains how to set up Dexcom Continuous Glucose Monitor (CGM) integration with Chatita.

## Overview

The Dexcom integration allows users to automatically sync their glucose readings from their Dexcom CGM device directly into Chatita, eliminating the need for manual data entry.

## Features

- **Automatic Sync**: Glucose readings sync every 15 minutes automatically
- **Manual Sync**: Users can trigger sync on-demand from settings
- **OAuth 2.0 Security**: Secure authentication via Dexcom's OAuth flow
- **Token Management**: Automatic refresh token handling
- **Dual Environment**: Support for both sandbox (testing) and production
- **Error Recovery**: Automatic retry and error tracking
- **Privacy**: User credentials never stored in Chatita

## Prerequisites

1. **Dexcom Developer Account**
   - Go to https://developer.dexcom.com
   - Create an account and verify your email
   - Agree to Terms of Service

2. **Register Your Application**
   - Log in to Dexcom Developer Portal
   - Create a new application
   - Provide application details:
     - Name: Chatita (or your app name)
     - Description: Diabetes management app with meal tracking
     - Redirect URI: See below

## Step-by-Step Setup

### 1. Register App on Dexcom Developer Portal

**Redirect URIs:**

For local development:
```
http://localhost:3000/api/dexcom/callback
```

For production:
```
https://your-domain.vercel.app/api/dexcom/callback
```

**Important:** The redirect URI must match EXACTLY. Include both if you want to test locally and in production.

### 2. Get Your Credentials

After registering your app, you'll receive:
- **Client ID**: A unique identifier for your app
- **Client Secret**: A confidential password (keep this secret!)

### 3. Configure Environment Variables

Add to your `.env` file (or `.env.local` for local dev):

```bash
# Dexcom CGM Integration
DEXCOM_CLIENT_ID="your-client-id-here"
DEXCOM_CLIENT_SECRET="your-client-secret-here"
DEXCOM_ENVIRONMENT="sandbox"  # Use "sandbox" for testing, "production" for real data
DEXCOM_REDIRECT_URI="http://localhost:3000/api/dexcom/callback"
```

**For Production (Vercel):**

In Vercel Dashboard → Settings → Environment Variables, add:
- `DEXCOM_CLIENT_ID`
- `DEXCOM_CLIENT_SECRET`
- `DEXCOM_ENVIRONMENT` = `production`
- `DEXCOM_REDIRECT_URI` = `https://your-domain.vercel.app/api/dexcom/callback`

### 4. Database Migration

The Dexcom integration model is already in the schema. Push changes:

```bash
npx prisma db push
```

### 5. Configure Cron Job

The automatic sync runs via Vercel Cron (already configured in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/dexcom-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Cron Schedule:** Every 15 minutes

Make sure `CRON_SECRET` is set in your environment variables for security.

## User Flow

### Connecting Dexcom

1. User goes to Settings page
2. Clicks "Connect Dexcom Account"
3. Redirected to Dexcom login page
4. User enters their Dexcom credentials
5. User authorizes Chatita to access their data
6. User is redirected back to Chatita Settings
7. Success message shown: "Dexcom connected successfully!"

### Automatic Syncing

Once connected:
- Glucose data syncs automatically every 15 minutes (configurable)
- Last sync time displayed in settings
- Manual "Sync Now" button available
- Errors are logged and displayed to user

### Disconnecting

Users can disconnect anytime:
1. Go to Settings
2. Click "Disconnect" under Dexcom section
3. Confirm disconnection
4. Integration removed (existing data remains)

## Testing with Sandbox

Dexcom provides a sandbox environment with test data.

### Sandbox Test Accounts

Dexcom provides test accounts in sandbox mode. Check their documentation:
- https://developer.dexcom.com/docs/dexcom/sandbox-data/

### Using Sandbox

Set environment to sandbox:
```bash
DEXCOM_ENVIRONMENT="sandbox"
```

Sandbox API Base URL: `https://sandbox-api.dexcom.com`

## API Endpoints

### User-Facing Endpoints

#### `GET /api/dexcom/authorize`
Initiates OAuth flow, redirects to Dexcom login.

**Query Parameters:** None (userId from session)

**Response:** HTTP 302 Redirect to Dexcom

---

#### `GET /api/dexcom/callback`
Handles OAuth callback after user authorizes.

**Query Parameters:**
- `code` - Authorization code from Dexcom
- `state` - Security state parameter

**Response:** Redirect to settings with status

---

#### `POST /api/dexcom/sync`
Manually trigger glucose data sync.

**Authentication:** Required (session)

**Response:**
```json
{
  "success": true,
  "imported": 145,
  "total": 145,
  "lastSync": "2025-02-06T10:30:00Z"
}
```

---

#### `GET /api/dexcom/sync`
Get current sync status.

**Authentication:** Required

**Response:**
```json
{
  "connected": true,
  "isActive": true,
  "lastSyncAt": "2025-02-06T10:30:00Z",
  "autoSync": true,
  "syncFrequency": 15,
  "environment": "sandbox"
}
```

---

#### `POST /api/dexcom/disconnect`
Remove Dexcom integration.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Dexcom integration disconnected successfully"
}
```

### System Endpoints

#### `POST /api/cron/dexcom-sync`
Automated sync for all users (called by Vercel Cron).

**Authentication:** Bearer token (`CRON_SECRET`)

**Response:**
```json
{
  "success": true,
  "total": 5,
  "synced": 4,
  "failed": 1,
  "skipped": 0,
  "errors": [...]
}
```

## Data Flow

```
┌─────────────┐
│ Dexcom CGM  │
│   Device    │
└──────┬──────┘
       │ Bluetooth
       ▼
┌─────────────┐
│   Dexcom    │
│   Cloud     │
└──────┬──────┘
       │ HTTPS API
       ▼
┌─────────────┐      ┌──────────────┐
│   Chatita   │◄────►│   Database   │
│   Server    │      │  (Postgres)  │
└─────────────┘      └──────────────┘
```

1. User wears Dexcom CGM device
2. Device sends readings to Dexcom Cloud
3. Chatita fetches readings via Dexcom API
4. Readings stored in GlucoseEntry table
5. User sees data in Chatita app

## Database Schema

### DexcomIntegration Model

```prisma
model DexcomIntegration {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(...)

  // OAuth tokens
  accessToken     String   @db.Text
  refreshToken    String   @db.Text
  tokenExpiresAt  DateTime

  // Settings
  autoSync        Boolean  @default(true)
  syncFrequency   Int      @default(15) // minutes
  environment     String   @default("production")

  // Status
  isActive        Boolean  @default(true)
  lastSyncAt      DateTime?
  lastError       String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### GlucoseEntry Model

Dexcom readings are stored as regular glucose entries:

```prisma
model GlucoseEntry {
  id          String   @id @default(cuid())
  userId      String
  value       Float    // mg/dL
  measuredAt  DateTime
  notes       String?  // "Dexcom CGM (Trend: ↑)"
  context     String?  // "random" for CGM
}
```

## Rate Limits

Dexcom API allows:
- **60,000 calls per app per hour**

Current usage with 100 users and 15-min sync:
- 100 users × 4 syncs/hour = 400 calls/hour
- Well within limits

## Security Considerations

### Token Storage
- Access tokens stored encrypted in database
- Refresh tokens used to get new access tokens
- Tokens expire and auto-refresh

### State Parameter
- Random state generated per OAuth request
- Validated on callback to prevent CSRF
- Includes timestamp to prevent replay attacks

### HTTPS Only
- All API calls use HTTPS
- Tokens never exposed to client
- OAuth flow over secure connections

## Troubleshooting

### "Dexcom not configured" Error

**Cause:** Missing environment variables

**Solution:**
```bash
# Check your .env file
DEXCOM_CLIENT_ID="..."
DEXCOM_CLIENT_SECRET="..."
DEXCOM_REDIRECT_URI="..."
```

### "Token exchange failed" Error

**Cause:** Invalid credentials or redirect URI mismatch

**Solution:**
- Verify credentials in Dexcom developer portal
- Ensure redirect URI matches exactly
- Check environment (sandbox vs production)

### "Product not found" During Sync

**Cause:** No Dexcom data available for time range

**Solution:**
- Check if user has CGM device active
- Verify environment (sandbox vs production)
- Ensure user authorized data sharing

### Automatic Sync Not Working

**Cause:** Cron job not configured or CRON_SECRET mismatch

**Solution:**
- Verify `vercel.json` has cron configuration
- Check Vercel dashboard for cron logs
- Ensure `CRON_SECRET` matches in environment

### "Unauthorized" on Sync

**Cause:** Expired or invalid access token

**Solution:**
- Automatic token refresh should handle this
- If persists, disconnect and reconnect Dexcom
- Check lastError field in DexcomIntegration

## Best Practices

1. **Use Sandbox for Testing**
   - Always test with sandbox first
   - Switch to production only when ready

2. **Monitor Errors**
   - Check `lastError` field regularly
   - Set up alerts for sync failures
   - Review Vercel function logs

3. **Respect Rate Limits**
   - Default 15-min sync is safe
   - Don't decrease below 5 minutes
   - Monitor API call usage

4. **User Communication**
   - Show clear connection status
   - Display last sync time
   - Provide helpful error messages

5. **Data Privacy**
   - Never log access tokens
   - Use HTTPS everywhere
   - Follow HIPAA guidelines if applicable

## Production Checklist

- [ ] Dexcom app registered in production environment
- [ ] Production credentials in Vercel environment variables
- [ ] DEXCOM_ENVIRONMENT set to "production"
- [ ] Redirect URI matches production domain
- [ ] CRON_SECRET configured for automated sync
- [ ] Database migrations applied
- [ ] Error monitoring set up
- [ ] User documentation created
- [ ] Privacy policy updated (if needed)
- [ ] Terms of service updated (if needed)

## Additional Resources

- [Dexcom Developer Portal](https://developer.dexcom.com/)
- [Dexcom API Documentation](https://developer.dexcom.com/docs/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Support

For issues with:
- **Chatita integration**: Check this documentation
- **Dexcom API**: Contact Dexcom developer support
- **OAuth flow**: Review OAuth 2.0 specification

## Changelog

### v1.0.0 (2025-02-06)
- Initial Dexcom CGM integration
- OAuth 2.0 authentication
- Automatic sync every 15 minutes
- Manual sync capability
- Settings page UI
- Error handling and recovery
