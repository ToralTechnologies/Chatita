# Apple HealthKit iOS Companion App — Technical Design Plan

## Why Direct Apple Health Sync Requires an iOS App

Apple HealthKit is a framework that lives on-device. It requires explicit user permission — per data type — that can only be requested from a native iOS (or iPadOS) app. A website (even a Progressive Web App) cannot access HealthKit from Safari or any browser on iOS.

What Apple does support from a website:
- **Apple Health export** — the user manually exports all health data from the Health app and uploads the resulting `export.xml` file. This is the current Chatita approach.

What requires a native iOS companion app:
- Background sync (passive, automatic)
- Real-time or near-real-time health data
- Fine-grained permission per data type

---

## Near-Term Path (Currently Implemented)

Users who want Apple Health data in Chatita today:

1. Open iPhone → **Health** app
2. Tap profile picture (top right)
3. Tap **Export All Health Data**
4. Share the ZIP file (extract `export.xml`)
5. Upload `export.xml` in **Chatita Settings → Connected Health Data → Apple Health**

Chatita parses only the selected data types (steps, sleep, activity, etc.) and discards the raw file after processing. The raw XML is never stored on the server.

---

## Future iOS Companion App Architecture

### App scope

A lightweight iOS companion app (not a full re-implementation of Chatita) that:
- Requests HealthKit permissions for the data types Chatita needs
- Reads daily summaries in the background
- Sends normalized summaries to the Chatita backend
- Shows simple sync status and permission management

### HealthKit permissions to request

Request only what Chatita needs. Request in batches — don't ask for everything at once.

**Default (ask on first launch):**
- `HKQuantityTypeIdentifierStepCount` — steps
- `HKQuantityTypeIdentifierActiveEnergyBurned` — active calories
- `HKQuantityTypeIdentifierAppleExerciseTime` — exercise minutes
- `HKQuantityTypeIdentifierDistanceWalkingRunning` — distance
- `HKCategoryTypeIdentifierSleepAnalysis` — sleep

**Optional (ask separately, explain why):**
- `HKQuantityTypeIdentifierHeartRate` — heart rate
- `HKQuantityTypeIdentifierRestingHeartRate` — resting heart rate
- `HKQuantityTypeIdentifierBodyMass` — body weight (explain: "helps contextualize calorie and activity data")
- `HKQuantityTypeIdentifierBloodGlucose` — blood glucose (explain: "imported readings appear alongside your manual logs"; requires explicit consent)

**Never request:**
- Reproductive health data (user should provide cycle data directly in Chatita with full informed consent)
- Genetic data
- Medical records
- Clinical records

### Normalization contract

The companion app produces a normalized daily summary payload that matches `HealthDailySummary` in Chatita's schema:

```json
{
  "date": "2026-06-26",
  "provider": "apple_healthkit_companion_future",
  "steps": 6842,
  "activeMinutes": 32,
  "exerciseMinutes": 25,
  "distanceMeters": 5100.5,
  "activeCalories": 310.2,
  "sleepMinutes": 412,
  "restingHeartRate": 62,
  "averageHeartRate": 74
}
```

### Backend endpoint (stub — see route file)

`POST /api/health/apple/companion/sync`

**Authentication design (TBD):**
Options under consideration:
1. **Session-based** — companion app authenticates with the same Chatita account (NextAuth session via a deep link or OAuth handshake)
2. **Long-lived API token** — generated in Chatita settings, entered once in the companion app
3. **OAuth device flow** — companion app uses device flow to get a token that the user approves on the website

Decision needed before implementation: which auth method matches Chatita's security requirements and user experience expectations.

**Request shape:**
```json
POST /api/health/apple/companion/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "summaries": [
    { "date": "2026-06-26", "steps": 6842, ... },
    { "date": "2026-06-25", "steps": 5200, ... }
  ]
}
```

**Response:**
```json
{ "success": true, "upserted": 2 }
```

The backend upserts each summary into `HealthDailySummary` with `provider = 'apple_healthkit_companion_future'`.

### Sync frequency

- **Background sync**: once per day (HealthKit background delivery)
- **Foreground sync**: on app open, sync last 7 days
- **Cursor**: track `lastSyncedAt` in the `HealthConnection` record

### Privacy and consent language (in-app)

> "Chatita will read the health data types you choose and send daily summaries to your Chatita account. Chatita does not store raw sensor data. You can revoke access anytime from iPhone Settings → Privacy → Health."

> "This data helps Chatita personalize supportive insights about meals, movement, sleep, and glucose patterns. Chatita does not diagnose, prescribe, or replace medical care."

### Data retention policy

- Daily summaries are kept as long as the user has an account
- Summaries are included in account deletion (Prisma cascade on User delete)
- Users can request deletion of all connected health data separately (TODO: add DELETE /api/health/data endpoint)
- Raw HealthKit data is never stored — only normalized summaries

---

## Implementation Checklist (Future)

- [ ] Create iOS Xcode project (Swift / SwiftUI)
- [ ] Request HealthKit entitlement from Apple
- [ ] Implement HealthKit permission request flow
- [ ] Implement daily summary aggregation (HKStatisticsCollectionQuery)
- [ ] Implement background delivery (HKObserverQuery + background tasks)
- [ ] Implement authentication (decision: session / API token / device flow)
- [ ] Implement `POST /api/health/apple/companion/sync` endpoint (currently stubbed)
- [ ] Test with Apple Health demo data
- [ ] Submit to App Store (requires HealthKit entitlement approval)
- [ ] Add companion sync status to Chatita settings (show "Last synced from iPhone")

---

## References

- [HealthKit overview — Apple Developer](https://developer.apple.com/documentation/healthkit)
- [Authorizing access to health data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [HKStatisticsCollectionQuery](https://developer.apple.com/documentation/healthkit/hkstatisticscollectionquery)
- [Google Health API](https://developers.google.com/health) — parallel path for Android / Fitbit / Pixel Watch
