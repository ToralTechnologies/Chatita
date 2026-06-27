# QA Checklist — Connected Health Data Integrations

## Setup
- [ ] `npx prisma db push` applied successfully (HealthConnection, HealthDailySummary, HealthMetricSample, HealthImport, HealthSyncLog models)
- [ ] `npx tsc --noEmit` passes clean
- [ ] `npx next build` passes clean
- [ ] `.env.example` updated with Google Health and Apple Health import vars

## Settings — Connected Health Data card

### General
- [ ] "Connected Health Data" section appears in Settings (mobile and desktop)
- [ ] Privacy notice is visible: "Connected data is optional..."
- [ ] Three cards visible: Google Health, Apple Health, Manual logging

### Google Health / Fitbit card
- [ ] Card shows "Connect Google Health" button when not connected
- [ ] Benefits list visible when not connected
- [ ] Fine print mentions Google Health API replaces legacy Fitbit Web API (Sept 2026 shutdown)
- [ ] Clicking "Connect Google Health" redirects to /api/health/google/connect
- [ ] If GOOGLE_HEALTH_CLIENT_ID not configured: returns descriptive error (not 500 crash)
- [ ] If configured: OAuth redirect goes to Google accounts.google.com
- [ ] OAuth callback handles `error` param: redirects to /settings?health_error=...
- [ ] OAuth callback handles missing `state`: redirects with error
- [ ] OAuth callback handles expired state (>10 min): redirects with error
- [ ] Successful OAuth: tokens stored encrypted in HealthConnection (not plain text)
- [ ] After connect: card shows "Connected" badge, last synced time, Sync Now and Disconnect buttons
- [ ] "Sync now" triggers POST /api/health/google/sync
- [ ] After sync: recordsProcessed count shown
- [ ] Token expiry triggers automatic refresh
- [ ] If refresh fails: connection status → error, user sees "Please reconnect" message
- [ ] "Disconnect" shows confirmation dialog
- [ ] After disconnect: tokens cleared, status → disconnected, card reverts to Connect state

### Apple Health card
- [ ] Card shows "Upload Apple Health export" button
- [ ] Export instructions are clear: Health → profile → Export All Health Data
- [ ] Clicking Upload shows:
  - Data type selector (9 types)
  - Steps/distance/active calories/exercise/sleep ON by default
  - Heart rate/resting heart rate/weight/blood glucose OFF by default
  - Weight and blood glucose show "opt-in" label
  - Consent notice visible
  - File input accepting .xml and .zip
  - File size limit note
  - Import and Cancel buttons
- [ ] Non-.xml / non-.zip files rejected with clear error
- [ ] Files over size limit rejected with clear error
- [ ] Valid export.xml processes successfully
- [ ] ZIP upload returns descriptive "extract export.xml" message (not silently fails)
- [ ] Non-Apple-Health XML file returns descriptive error
- [ ] After successful import: success message with record count and days count
- [ ] Import history shows recent imports (provider, filename, status, records, date)
- [ ] "Import" disables button and shows spinner while processing

### Manual logging card
- [ ] Shows Movement, Sleep, Glucose, Meals, Mood links
- [ ] Privacy note: "Chatita works great without any connected device"

---

## API Routes

### GET /api/health/connections
- [ ] Returns 401 for unauthenticated request
- [ ] Returns connections, syncLogs, recentImports arrays
- [ ] No tokens returned (accessTokenEnc / refreshTokenEnc not in response)
- [ ] Empty arrays when user has no connections

### GET /api/health/google/connect
- [ ] Returns 401 for unauthenticated
- [ ] Returns 500 with descriptive message if GOOGLE_HEALTH_CLIENT_ID not set
- [ ] Returns redirect to Google OAuth when configured

### GET /api/health/google/callback
- [ ] Handles `error` query param → redirects with health_error
- [ ] Missing `code` or `state` → redirects with health_error=missing_params
- [ ] Invalid/corrupted state → redirects with health_error=invalid_state
- [ ] Expired state (>10 min) → redirects with error
- [ ] Token exchange failure → redirects with health_error=token_exchange_failed
- [ ] Successful flow → creates/upserts HealthConnection with encrypted tokens
- [ ] Tokens in DB are NOT plain text (check with prisma studio or raw query)
- [ ] Redirects to /settings?health_success=google_health on success

### POST /api/health/google/sync
- [ ] Returns 401 for unauthenticated
- [ ] Returns 400 if no Google Health connection
- [ ] Returns 400 if connection is disconnected
- [ ] Creates HealthSyncLog entry with status=started
- [ ] Refreshes token if expired
- [ ] Updates HealthDailySummary records (upserts by userId+date+provider)
- [ ] Updates lastSyncedAt on HealthConnection
- [ ] Updates HealthSyncLog status to completed (or partial on error)
- [ ] Returns { success, recordsSynced, warning? }

### POST /api/health/google/disconnect
- [ ] Returns 401 for unauthenticated
- [ ] Returns 404 if no connection
- [ ] Attempts token revocation on Google (non-fatal if fails)
- [ ] Clears accessTokenEnc, refreshTokenEnc, tokenExpiresAt
- [ ] Sets status=disconnected, disconnectedAt=now
- [ ] Returns { success: true }
- [ ] Does NOT delete existing HealthDailySummary records

### POST /api/health/apple/import
- [ ] Returns 401 for unauthenticated
- [ ] Returns 400 for missing file
- [ ] Returns 400 for non-.xml / non-.zip file types
- [ ] Returns 413 for oversized file
- [ ] Returns 400 for ZIP (with "extract export.xml" message)
- [ ] Returns 400 for non-Apple-Health XML
- [ ] Creates HealthImport record with status=processing
- [ ] Parses only selected data types (not all records)
- [ ] Aggregates records into per-day summaries
- [ ] Upserts HealthDailySummary for provider=apple_health_export
- [ ] Updates HealthImport status=completed, recordsProcessed, completedAt
- [ ] Returns { success, recordsProcessed, daysImported }
- [ ] Raw XML file NOT stored server-side (only parsed summaries persisted)

### GET /api/health/imports
- [ ] Returns 401 for unauthenticated
- [ ] Returns import history newest-first
- [ ] Max 20 records returned

### GET /api/health/today?date=YYYY-MM-DD
- [ ] Returns 401 for unauthenticated
- [ ] Returns summaries for given date (or today if not specified)
- [ ] Returns summaries from all providers
- [ ] Returns empty array when no connected data for date

---

## Dashboard — HealthTodayCard
- [ ] Card is hidden when no connected data for today
- [ ] Card appears when HealthDailySummary exists for today
- [ ] Shows correct provider label (Google Health / Apple Health)
- [ ] Shows steps, active minutes, sleep, resting HR (whichever are available)
- [ ] Shows "Updated HH:MM" time
- [ ] Disclaimer visible: "Connected data may be incomplete. Log manually anytime..."
- [ ] Does not interfere with manual MovementCard or SleepCard below it
- [ ] Prefers google_health over apple_health_export when both present

---

## AI Chat Integration
- [ ] AI context includes connected health data when available
- [ ] AI uses cautious language for connected data: "may," "could be related," "a pattern worth tracking"
- [ ] AI does NOT say "your wearable proves," "your steps caused," or similar
- [ ] AI does NOT mention "Google Fitness API" or "HealthKit" to the user
- [ ] AI does NOT shame low steps / low activity
- [ ] AI accounts for GLP-1 fatigue when connected data shows low steps + user mentioned nausea
- [ ] AI context does NOT include tokens or sensitive auth data

---

## Security
- [ ] No OAuth tokens in plain text in DB (verify)
- [ ] No tokens in API responses
- [ ] No NEXT_PUBLIC_ prefix on secret env vars
- [ ] Google OAuth callback validates state (timestamp + userId)
- [ ] Apple Health import validates file type
- [ ] Apple Health import enforces size limit
- [ ] All health routes require authentication
- [ ] Users can only access their own connections/imports/summaries
- [ ] Token revocation attempted on Google disconnect

---

## Privacy
- [ ] Raw Apple Health export is not stored (only normalized summaries)
- [ ] User can disconnect Google Health anytime
- [ ] Disconnecting removes tokens (data stays — user can request deletion separately)
- [ ] Consent notice shown before Apple Health import
- [ ] Privacy language: "Chatita does not diagnose, prescribe, or replace medical care"
- [ ] Google Health connection shows what data will be imported (benefits list)

---

## Error Handling
- [ ] Google OAuth callback: all error paths redirect to /settings with health_error param
- [ ] Google sync: graceful partial success (returns `warning` field when some data fails)
- [ ] Apple import: all error paths return descriptive JSON error messages
- [ ] Token refresh failure: connection marked as error, user prompted to reconnect
- [ ] Large XML file: no server crash or timeout (test with ~10MB file)
- [ ] Missing env vars: descriptive error, not 500 with stack trace

---

## Manual Testing Steps

### Google Health (requires configured credentials)
1. Set GOOGLE_HEALTH_CLIENT_ID, GOOGLE_HEALTH_CLIENT_SECRET, GOOGLE_HEALTH_REDIRECT_URI in .env
2. Go to Settings → Connected Health Data → Connect Google Health
3. Complete Google OAuth consent flow
4. Verify: "Connected" badge appears, no tokens visible in UI
5. Click "Sync now" → verify recordsSynced > 0 if account has fitness data
6. Check Prisma: `HealthDailySummary` records exist with provider=google_health, tokens encrypted
7. Click "Disconnect" → confirm → verify card reverts to Connect state

### Apple Health import (use sample file)
1. Create a minimal test export.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" value="6842" unit="count"
    startDate="2026-06-26 00:00:00 +0000" endDate="2026-06-26 23:59:59 +0000" sourceName="iPhone"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="1" unit="" 
    startDate="2026-06-25 23:00:00 +0000" endDate="2026-06-26 07:00:00 +0000" sourceName="Apple Watch"/>
</HealthData>
```
2. Go to Settings → Apple Health → Upload Apple Health export
3. Select steps + sleep, click Choose File, select export.xml, click Import
4. Verify: success message "2 records across 1 day"
5. Check Dashboard: HealthTodayCard appears if date matches today
6. Try uploading a .txt file → should be rejected
7. Try uploading a non-Apple-Health XML → should get descriptive error

### Dashboard
1. After import, go to /
2. HealthTodayCard should appear above MovementCard
3. Shows steps, sleep from the import
4. Shows "Apple Health" as source

---

## Remaining TODOs / Known Gaps

1. **Google Health API (GA)**: Current implementation uses Google Fitness REST API. When the Google Health API becomes generally available, update endpoints and scopes at developers.google.com/health. The OAuth flow is the same.

2. **ZIP extraction**: Apple Health exports are ZIPs. Currently, users must extract export.xml manually. Adding `fflate` or `jszip` package would allow direct ZIP upload.

3. **DELETE /api/health/data**: Allow users to delete all imported health data (GDPR/privacy compliance). Currently, data is only deleted on account deletion.

4. **Workouts**: Google Fitness API can return workout sessions. HealthDailySummary has `workoutCount` but it's not populated yet in the sync route.

5. **Heart rate intraday data**: For detailed HR samples, use `HealthMetricSample` model. Currently only daily resting HR is synced.

6. **iOS companion app**: See docs/APPLE_HEALTHKIT_COMPANION_PLAN.md.

7. **Google Health API developer access**: Must apply at developers.google.com/health before production use. Current implementation uses Fitness API as fallback.

8. **Rate limiting on sync**: Consider adding rate limiting on POST /api/health/google/sync to prevent excessive API calls.

9. **Large Apple Health exports**: Files over 50MB (the default limit) require raising HEALTH_IMPORT_MAX_FILE_SIZE_MB. Users with years of health data may have very large exports.

10. **Webhook / push notifications**: Google Fitness API supports data source subscriptions. Consider implementing push-based sync (rather than poll-based) for real-time updates.
