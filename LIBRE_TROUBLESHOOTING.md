# LibreLinkUp Integration Troubleshooting

This guide helps resolve common issues with the FreeStyle Libre / LibreLinkUp integration.

## Common Error: 403 Forbidden

### What It Means
A 403 error means LibreLinkUp is denying access to the API. This can happen for several reasons.

### Possible Causes & Solutions

#### 1. Terms of Service Not Accepted (Most Common)

**Problem:** Abbott requires users to accept new Terms of Service in the LibreLinkUp app before API access works.

**Solution:**
1. Open the **LibreLinkUp app** on your phone
2. Log in with your credentials
3. **Accept any Terms of Service** prompts
4. Make sure you can see your glucose data in the app
5. Try connecting in Chatita again

**Why this happens:** Abbott periodically updates their ToS and requires explicit acceptance in the mobile app.

---

#### 2. No Active Connections

**Problem:** LibreLinkUp requires at least one "connection" (someone you're following or who's sharing with you).

**Solution:**
1. Open LibreLinkUp app
2. Make sure you have at least one connection
3. If using your own Libre sensor:
   - Use the **LibreLink app** (not LibreLinkUp)
   - Set up sharing from LibreLink to LibreLinkUp
   - Add yourself as a connection
4. If following someone:
   - Confirm they've shared access with you
   - Verify the connection is active

**How to set up self-sharing:**
1. Install **LibreLink** (main app for your sensor)
2. Scan your Libre sensor with LibreLink
3. Enable "Share My Data" in LibreLink settings
4. Install **LibreLinkUp** (follower app)
5. Add yourself as a connection using the invite code
6. Accept the connection in LibreLinkUp

---

#### 3. Wrong Region Selected

**Problem:** Your account is registered in a different region than what you selected.

**Solution:**
Try different regions in the connection form:
- **US** - For US/Canada accounts
- **EU** - For European accounts
- **AP** (Asia-Pacific) - For Asian/Australian accounts

**How to check your region:**
1. Open LibreLinkUp app
2. Check which website URL it uses:
   - `api.libreview.io` → US
   - `api-eu.libreview.io` → EU
   - `api-ap.libreview.io` → AP

---

#### 4. Recently Changed Password

**Problem:** LibreLinkUp session may be invalidated after password change.

**Solution:**
1. Wait 5-10 minutes after password change
2. Log out of all LibreLinkUp apps
3. Log back in to LibreLinkUp mobile app
4. Accept any prompts
5. Try connecting in Chatita again

---

#### 5. Account Locked or Suspended

**Problem:** Too many failed login attempts or Terms violation.

**Solution:**
1. Try logging into LibreLinkUp mobile app
2. If locked, follow account recovery steps
3. Contact Abbott support if needed
4. Wait 30 minutes before retry

---

#### 6. API Rate Limiting

**Problem:** Too many API requests in short time.

**Solution:**
1. Wait 15-30 minutes before retrying
2. Don't spam the "Connect" button
3. Only use one Chatita instance at a time

---

## Error Messages Guide

### "Invalid email or password"
- ✅ Check credentials are correct
- ✅ Make sure it's LibreLinkUp credentials (not FreeStyle Libre website)
- ✅ Try logging into LibreLinkUp app to verify

### "Access denied. LibreLinkUp may be blocking API access"
- ✅ Accept Terms of Service in mobile app
- ✅ Try different region
- ✅ Check for active connections
- ✅ Verify account is not locked

### "No patient connections found"
- ✅ Add at least one connection in LibreLinkUp
- ✅ Set up self-sharing from LibreLink app
- ✅ Verify connection is active in app

### "Authentication expired. Please reconnect"
- ✅ Click "Sync Now" to auto-refresh
- ✅ Or disconnect and reconnect account
- ✅ Check if password was changed

---

## Testing Your Setup

### Step 1: Verify LibreLinkUp App Works
```
1. Open LibreLinkUp mobile app
2. Can you log in? → Yes ✅
3. Can you see glucose data? → Yes ✅
4. Do you have connections? → Yes ✅
5. Any Terms prompts? → Accepted ✅
```

If all yes → Try Chatita connection again

### Step 2: Test Each Region
If still failing, try all three regions:
1. US
2. EU
3. AP (Asia-Pacific)

One should work based on where your account was created.

### Step 3: Check Connection in App
```
LibreLinkUp app → Connections tab
- Should show at least 1 connection
- Status should be "Active"
- Recent glucose data visible
```

---

## Alternative: Use Dexcom Instead

If LibreLinkUp continues to have issues, consider:

1. **Switch to Dexcom** (if you have a Dexcom CGM)
   - More reliable official API
   - OAuth-based authentication
   - Better long-term support

2. **Manual Logging** (always works)
   - Enter glucose readings manually
   - Takes 10 seconds per entry
   - No API dependencies

---

## Known LibreLinkUp API Limitations

### Recent Changes (2024-2025)
Abbott has been tightening API access:
- ✅ **October 2024**: Added mandatory ToS acceptance
- ✅ **November 2024**: Increased rate limiting
- ✅ **December 2024**: Enhanced security checks
- ✅ **January 2025**: Regional API separation

### Unofficial API Notice
⚠️ **Important:** The LibreLinkUp integration uses an **unofficial API**. Abbott does not officially support third-party API access for LibreLinkUp.

**This means:**
- API may change without notice
- Access may be restricted or blocked
- No official support from Abbott
- May require periodic updates to Chatita

**Why we use it:**
- Dexcom requires expensive developer program ($300+)
- LibreLinkUp is accessible to more users
- Community has maintained working implementations
- Serves the #WeAreNotWaiting movement

---

## Getting Help

### If Still Not Working

1. **Check Chatita Logs**
   - Vercel Dashboard → Functions → Logs
   - Look for specific error messages
   - Share logs with support

2. **Community Resources**
   - GitHub Issues for LibreLinkUp unofficial API
   - FreeStyle Libre user forums
   - Diabetes tech communities

3. **Contact Support**
   - Provide error message
   - Specify region tried
   - Confirm LibreLinkUp app works
   - Screenshots if possible

### Temporary Workaround

While troubleshooting, you can:
1. **Use manual glucose entry** in Chatita
2. **Export from LibreView** website → Import to Chatita (future feature)
3. **Use Nightscout** if you have it set up (future integration)

---

## Success Checklist

Before connecting to Chatita:

- [ ] LibreLinkUp mobile app installed
- [ ] Can log into LibreLinkUp app
- [ ] Terms of Service accepted in app
- [ ] At least 1 active connection visible
- [ ] Can see glucose data in app
- [ ] Know which region (US/EU/AP)
- [ ] Using correct email/password
- [ ] No recent password changes (within 24h)

If all checked → Connection should work! ✅

---

## Future Improvements

We're working on:
- [ ] Better error messages
- [ ] Automatic region detection
- [ ] Connection testing tool
- [ ] Fallback to LibreView API
- [ ] Manual CSV import option

---

## Last Resort: Contact Abbott

If LibreLinkUp app itself isn't working:

**Abbott Customer Support:**
- US: 1-855-632-8658
- Website: freestyle.abbott

They can help with:
- Account issues
- App login problems
- Terms of Service questions
- Technical support

(They cannot help with Chatita integration - that's unofficial)

---

## Updates

### Latest Working Configuration (Feb 2025)
```
Product: llu.ios
Version: 4.10.0
User-Agent: iOS 17.0
```

This configuration is working as of February 2025. If it stops working, check for updates to Chatita or community API documentation.
