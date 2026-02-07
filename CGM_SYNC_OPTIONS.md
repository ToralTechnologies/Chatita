# CGM Automatic Sync Options

This document explains the different options for automatic CGM syncing based on your Vercel plan.

## Vercel Cron Job Limitations

### Hobby Plan (Free)
- ✅ **100 cron jobs per project**
- ⚠️ **Minimum interval: Once per day**
- ⚠️ **Timing precision: ±59 minutes**
- ❌ **Cannot run every 15 minutes**

### Pro Plan ($20/month)
- ✅ **100 cron jobs per project**
- ✅ **Minimum interval: Once per minute**
- ✅ **Precise timing**
- ✅ **Can run every 15 minutes**

### Enterprise Plan
- ✅ **100 cron jobs per project**
- ✅ **Minimum interval: Once per minute**
- ✅ **Precise timing**
- ✅ **Custom configurations**

---

## Current Configuration

### For Hobby Plan (Default)

```json
{
  "crons": [
    {
      "path": "/api/cron/dexcom-sync",
      "schedule": "0 8 * * *"  // Daily at 8:00 AM
    },
    {
      "path": "/api/cron/libre-sync",
      "schedule": "0 9 * * *"  // Daily at 9:00 AM
    }
  ]
}
```

**Schedule:**
- Dexcom sync: Every day at 8:00 AM (±59 min)
- Libre sync: Every day at 9:00 AM (±59 min)

**Note:** Users can still manually sync anytime via the "Sync Now" button in settings.

---

## Upgrade to Pro Plan for More Frequent Sync

If you upgrade to Vercel Pro, update `vercel.json` to:

```json
{
  "crons": [
    {
      "path": "/api/cron/dexcom-sync",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    },
    {
      "path": "/api/cron/libre-sync",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    }
  ]
}
```

**Schedule:**
- Dexcom sync: Every 15 minutes
- Libre sync: Every 15 minutes

---

## Alternative: Client-Side Polling (No Cron Needed)

If you want more frequent syncing without upgrading to Pro, you can implement client-side polling.

### Option 1: Auto-sync on Page Load

Add this to your home page or glucose tracking page:

```typescript
// app/(main)/home/page.tsx
useEffect(() => {
  const syncCGM = async () => {
    // Check if last sync was > 15 minutes ago
    const lastSync = localStorage.getItem('lastCGMSync');
    const now = Date.now();

    if (!lastSync || now - parseInt(lastSync) > 15 * 60 * 1000) {
      // Trigger sync
      await fetch('/api/dexcom/sync', { method: 'POST' });
      await fetch('/api/libre/sync', { method: 'POST' });
      localStorage.setItem('lastCGMSync', now.toString());
    }
  };

  syncCGM();
}, []);
```

**Pros:**
- Free (no Vercel Pro needed)
- Syncs when user opens the app
- No cron job limits

**Cons:**
- Only syncs when user is active
- Requires user to open app
- No background sync

### Option 2: Periodic Polling (While App is Open)

```typescript
// components/cgm-sync-provider.tsx
export function CGMSyncProvider({ children }) {
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetch('/api/dexcom/sync', { method: 'POST' });
      await fetch('/api/libre/sync', { method: 'POST' });
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
```

Wrap your app layout:

```typescript
// app/layout.tsx
<CGMSyncProvider>
  {children}
</CGMSyncProvider>
```

**Pros:**
- Free (no Vercel Pro needed)
- Syncs every 15 minutes while app is open
- No cron job limits

**Cons:**
- Only works while app is open
- Uses browser resources
- No sync when app is closed

---

## Recommended Setup by Use Case

### 1. Free/Hobby Users (Most Users)
**Best Option:** Daily cron + manual sync button

**Configuration:**
- Use current `vercel.json` (daily cron)
- Users manually sync via "Sync Now" button when needed
- Sufficient for most users who check their app daily

**Why:**
- No cost
- Users can sync anytime
- Automatic daily backup sync
- Simple and reliable

### 2. Power Users (Need Frequent Updates)
**Best Option:** Upgrade to Pro + 15-min cron

**Configuration:**
- Upgrade to Vercel Pro ($20/month)
- Update `vercel.json` to `*/15 * * * *`
- True automatic sync every 15 minutes

**Why:**
- Real-time glucose tracking
- No user intervention needed
- Professional-grade sync
- Background operation

### 3. Budget-Conscious Power Users
**Best Option:** Client-side polling

**Configuration:**
- Use Option 2 (Periodic Polling)
- Syncs every 15 min while app is open
- Manual sync when closed

**Why:**
- No monthly cost
- Frequent syncs when active
- Decent user experience
- Hybrid approach

---

## Manual Sync (Always Available)

Regardless of cron schedule, users can **always** manually sync:

1. Go to Settings
2. Find Dexcom or Libre section
3. Click "Sync Now" button
4. Wait for confirmation

**Use cases for manual sync:**
- Before meal logging
- After eating (to see glucose response)
- When checking current glucose
- Before/after exercise
- Anytime you want fresh data

---

## Implementation Guide

### Keep Hobby Plan (Daily Sync)

✅ **Already configured!** Just deploy as-is.

No changes needed. Current `vercel.json` works with Hobby plan.

### Upgrade to Pro (15-min Sync)

1. **Upgrade Vercel account to Pro**
   - Go to Vercel dashboard
   - Billing → Upgrade to Pro
   - Confirm $20/month charge

2. **Update `vercel.json`:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/dexcom-sync",
         "schedule": "*/15 * * * *"
       },
       {
         "path": "/api/cron/libre-sync",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   git add vercel.json
   git commit -m "Update cron to 15-min sync (Pro plan)"
   git push
   ```

4. **Verify in Vercel dashboard:**
   - Settings → Cron Jobs
   - Should show "Every 15 minutes"

### Implement Client-Side Polling

See code examples in "Alternative: Client-Side Polling" section above.

---

## Cost Comparison

| Option | Monthly Cost | Sync Frequency | User Experience |
|--------|--------------|----------------|-----------------|
| Hobby + Daily Cron | **$0** | Daily + Manual | Good |
| Hobby + Client Polling | **$0** | 15-min (when open) | Very Good |
| Pro + 15-min Cron | **$20** | 15-min (always) | Excellent |

---

## Conclusion

**Recommendation for most users:**
- **Start with Hobby plan** (daily cron + manual sync)
- **Add client-side polling** if you want more frequent updates
- **Upgrade to Pro** only if you need guaranteed 15-min background sync

The manual "Sync Now" button is always available and provides instant sync when needed, making the daily cron schedule sufficient for most users.

---

## Current Status

✅ **Configured for Hobby Plan**
- Dexcom: Daily at 8:00 AM
- Libre: Daily at 9:00 AM
- Manual sync always available

Ready to deploy! 🚀
