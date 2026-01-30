# 🗺️ Google Places API Setup Guide

## Overview

The Google Places API enables the restaurant finder to show **real restaurants** near the user's location instead of simulated data.

**Current Status**: Disabled (using simulated restaurant data - $0 mode)

**With Google Places**: Real restaurant data with photos, ratings, addresses, and phone numbers

---

## Cost Breakdown

### Google Places API Pricing (as of 2024)

**Free Tier:**
- $200 free credit per month (enough for ~10,000 searches)
- No credit card required initially

**After Free Credit:**
- **Nearby Search**: $0.032 per request
- **Place Details**: $0.017 per request
- **Place Photos**: $0.007 per request

**Estimated Monthly Cost:**

| Usage | Searches/Month | Cost |
|-------|---------------|------|
| Light | 100 | **$0** (free tier) |
| Medium | 500 | **$0** (free tier) |
| Heavy | 2,000 | **$0** (free tier) |
| Very Heavy | 15,000 | **$280/month** |

**For typical usage: $0/month** ✅

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Account

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Accept the Terms of Service

### Step 2: Create a New Project

1. Click on the **project dropdown** (top left, next to "Google Cloud")
2. Click **"New Project"**
3. Enter project details:
   - **Project name**: `Chatita` (or any name)
   - **Organization**: Leave as default
4. Click **"Create"**
5. Wait for the project to be created (~10 seconds)
6. Make sure your new project is selected in the dropdown

### Step 3: Enable Places API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or use the search bar and type "API Library"

2. In the API Library search, type: **"Places API"**

3. Click on **"Places API"** (the one with the pin icon)

4. Click the blue **"Enable"** button

5. Wait for it to enable (~5 seconds)

### Step 4: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**

2. Click **"Create Credentials"** (top of page)

3. Select **"API Key"**

4. Your API key will be created and shown in a popup
   - It looks like: `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q`

5. **Copy this key** and save it temporarily

### Step 5: Restrict Your API Key (Security)

**Important**: Restrict your key to prevent unauthorized use!

1. In the popup with your new key, click **"Edit API key"**
   - Or find your key in the list and click on it

2. **Application Restrictions**:
   - Select **"HTTP referrers (web sites)"**
   - Click **"Add an item"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     https://localhost:3000/*
     https://your-domain.vercel.app/*
     ```
   - Replace `your-domain.vercel.app` with your actual Vercel URL
   - Add more URLs if you have multiple domains

3. **API Restrictions**:
   - Select **"Restrict key"**
   - Search and select: **"Places API"**
   - Click **"OK"**

4. Click **"Save"** at the bottom

### Step 6: Enable Billing (Required for API)

**Note**: Even with free credits, you need to enable billing.

1. Go to **"Billing"** in the left sidebar
   - Or click the hamburger menu → **"Billing"**

2. Click **"Link a billing account"**

3. If you don't have a billing account:
   - Click **"Create billing account"**
   - Enter your information
   - Add a credit card (won't be charged unless you exceed free tier)
   - Click **"Start my free trial"** or **"Submit and enable billing"**

4. Accept the terms

**You'll get $300 free credit** for 90 days (Google Cloud free trial)

### Step 7: Add API Key to Chatita

#### For Local Development:

1. Open your `.env` file
2. Find the line: `GOOGLE_MAPS_API_KEY=""`
3. Update it:
   ```bash
   GOOGLE_MAPS_API_KEY=""
   ```
   *(Use your actual API key)*

4. Enable Google Places:
   ```bash
   ENABLE_GOOGLE_PLACES=true
   ```

5. Save the file

6. Restart your dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   ```
   Name: GOOGLE_MAPS_API_KEY
   Value: AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
   ```
4. Add another variable:
   ```
   Name: ENABLE_GOOGLE_PLACES
   Value: true
   ```
5. Click **"Save"**
6. Go to **"Deployments"** → Click **"Redeploy"**

---

## Testing Your Setup

### Test 1: Restaurant Finder

1. Go to: `http://localhost:3000/restaurant-finder`
2. Click **"Use My Location"** (allow browser location access)
3. Click **"Search Restaurants"**
4. You should see **real restaurants** near you with:
   - ✅ Restaurant names
   - ✅ Addresses
   - ✅ Ratings (stars)
   - ✅ Photos
   - ✅ Phone numbers

### Test 2: Search by Dish

1. Type a dish name: "grilled chicken"
2. Click **"Search Restaurants"**
3. You should see restaurants that serve that dish

### Test 3: Check Console Logs

Open browser console (F12) and check for:
- ✅ No errors
- ✅ Google Places API responses
- ✅ Restaurant data being fetched

---

## Troubleshooting

### Issue: "This API project is not authorized to use this API"

**Solution**:
1. Go to Google Cloud Console
2. Verify **Places API** is enabled
3. Click **"Enable"** if it's not
4. Wait 5 minutes for changes to propagate

### Issue: "The provided API key is invalid"

**Solution**:
1. Verify you copied the entire API key
2. Check for extra spaces in `.env`
3. Make sure the key is in quotes: `GOOGLE_MAPS_API_KEY="your-key"`
4. Restart your dev server

### Issue: "This API key is not authorized for this referrer"

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Click on your API key
3. Under **"Application restrictions"**:
   - Add: `http://localhost:3000/*`
   - Add: `https://your-domain.vercel.app/*`
4. Save and wait 5 minutes

### Issue: "You have exceeded your request quota"

**Solution**:
1. Check your usage: Google Cloud Console → **"APIs & Services"** → **"Dashboard"**
2. You might have hit the free tier limit
3. Options:
   - Wait until next month (quota resets)
   - Enable billing to get more quota
   - Reduce number of API calls

### Issue: "Billing must be enabled"

**Solution**:
1. Go to Google Cloud Console → **"Billing"**
2. Click **"Link a billing account"**
3. Add a credit card
4. You won't be charged unless you exceed free tier

### Issue: Restaurants not showing

**Solution**:
1. Check browser console for errors
2. Verify `ENABLE_GOOGLE_PLACES=true` in `.env`
3. Make sure API key is correct
4. Try a different location (some areas have fewer restaurants)
5. Check that browser location is enabled

---

## How It Works

### Without Google Places (Current - $0 Mode):

```typescript
// Simulated restaurant data
const restaurants = [
  {
    name: 'The Healthy Grill',
    cuisine: 'American',
    rating: 4.5,
    distance: '0.3 mi',
    // ... simulated data
  }
];
```

### With Google Places (Real Data):

```typescript
// Real API call to Google Places
const response = await fetch('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
  params: {
    location: `${latitude},${longitude}`,
    radius: 5000, // 5km
    type: 'restaurant',
    key: process.env.GOOGLE_MAPS_API_KEY,
  }
});

// Returns real restaurants with:
// - Actual names, addresses, ratings
// - Photos from Google Maps
// - Phone numbers
// - Opening hours
// - User reviews
```

---

## API Request Examples

### Nearby Search

```typescript
// Find restaurants near user
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json?
  location=37.7749,-122.4194&
  radius=5000&
  type=restaurant&
  key=YOUR_API_KEY
```

### Text Search (Search by Dish)

```typescript
// Find restaurants serving specific dish
GET https://maps.googleapis.com/maps/api/place/textsearch/json?
  query=restaurants+serving+grilled+chicken+near+me&
  location=37.7749,-122.4194&
  radius=5000&
  key=YOUR_API_KEY
```

### Place Details

```typescript
// Get full details for a restaurant
GET https://maps.googleapis.com/maps/api/place/details/json?
  place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&
  fields=name,rating,formatted_phone_number,opening_hours&
  key=YOUR_API_KEY
```

---

## Monitoring Usage

### Check Your Usage

1. Go to: **https://console.cloud.google.com/**
2. Select your project
3. Click **"APIs & Services"** → **"Dashboard"**
4. See graphs showing:
   - API requests per day
   - Errors
   - Latency

### Set Budget Alerts

1. Go to **"Billing"** → **"Budgets & alerts"**
2. Click **"Create Budget"**
3. Set budget amount: `$10` (or any amount)
4. Set alert at: `50%` and `90%`
5. Add your email
6. Click **"Finish"**

You'll get emails if you approach your budget.

---

## Best Practices

### 1. Cache Results

Cache restaurant searches to reduce API calls:

```typescript
// Cache results for 1 hour
const cacheKey = `restaurants:${lat}:${lng}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Otherwise, fetch from API
const results = await fetchFromGoogle();
await cache.set(cacheKey, results, 3600); // 1 hour
```

### 2. Limit Radius

Don't search too far - use 5km max:

```typescript
const SEARCH_RADIUS = 5000; // 5km
```

### 3. Limit Results

Request only what you need:

```typescript
// Limit to 20 results
const params = {
  // ...
  maxResults: 20,
};
```

### 4. Use Place IDs

Store place IDs instead of re-searching:

```typescript
// Save place_id in database
await saveRestaurant({
  placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'The Healthy Grill',
  // ...
});

// Later, fetch details using place_id (cheaper)
const details = await getPlaceDetails(placeId);
```

### 5. Restrict API Key

Always restrict your API key:
- ✅ Add referrer restrictions
- ✅ Limit to Places API only
- ✅ Enable only necessary features

---

## Alternative: Stay in $0 Mode

If you want to avoid any costs, you can keep using simulated data:

```bash
# Keep these in .env
ENABLE_GOOGLE_PLACES=false
GOOGLE_MAPS_API_KEY=""
```

**Simulated mode provides:**
- ✅ Restaurant recommendations (using ADA guidelines)
- ✅ Dish-based search
- ✅ Health tips for each restaurant
- ✅ No API costs
- ❌ Not real restaurants
- ❌ No photos or reviews

**Good for:** MVP, testing, demos, cost-sensitive deployments

---

## Summary

### Setup Steps:
1. ✅ Create Google Cloud account
2. ✅ Create project
3. ✅ Enable Places API
4. ✅ Create API key
5. ✅ Restrict API key (security)
6. ✅ Enable billing (required)
7. ✅ Add key to `.env`
8. ✅ Enable: `ENABLE_GOOGLE_PLACES=true`
9. ✅ Test restaurant finder

### Cost:
- **Free tier**: $200/month credit = ~10,000 searches
- **Typical usage**: $0/month
- **Heavy usage**: Monitor and set alerts

### Time:
- Setup: 15-20 minutes
- Testing: 5 minutes

---

## Resources

- **Google Places API Docs**: https://developers.google.com/maps/documentation/places/web-service
- **Pricing Calculator**: https://mapsplatform.google.com/pricing/
- **Google Cloud Console**: https://console.cloud.google.com/
- **API Usage Dashboard**: https://console.cloud.google.com/apis/dashboard

---

## Need Help?

**Google Cloud Support**: https://cloud.google.com/support

**Chatita Support**: Check browser console for error messages

---

**Ready to enable real restaurant data!** 🗺️

*Once set up, your users will see actual restaurants near them with photos, ratings, and reviews.*
