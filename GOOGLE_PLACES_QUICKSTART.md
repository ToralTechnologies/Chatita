# 🗺️ Google Places API - Quick Setup (5 Minutes)

## What You Get

**Without Google Places (Current - Free):**
- ✅ Simulated restaurant recommendations
- ✅ Dish-based search
- ✅ ADA guidelines and health tips
- ❌ Not real restaurants

**With Google Places (~$0-5/month):**
- ✅ Real restaurants near user
- ✅ Actual photos, ratings, reviews
- ✅ Phone numbers and addresses
- ✅ Everything from simulated mode PLUS real data

---

## Setup in 5 Steps

### Step 1: Get API Key (3 minutes)

1. Go to: **https://console.cloud.google.com/**
2. Create a project: Click dropdown → **"New Project"** → Name it `Chatita`
3. Enable API: Search for **"Places API"** → Click **"Enable"**
4. Create key: **"Credentials"** → **"Create Credentials"** → **"API Key"**
5. **Copy the key** (looks like: `AIzaSyA...`)

### Step 2: Restrict Key (1 minute - IMPORTANT for security)

1. Click **"Edit API key"**
2. **Application restrictions**:
   - Select: **"HTTP referrers"**
   - Add: `http://localhost:3000/*`
   - Add: `https://your-vercel-app.vercel.app/*`
3. **API restrictions**:
   - Select: **"Restrict key"**
   - Choose: **"Places API"**
4. Click **"Save"**

### Step 3: Enable Billing (1 minute)

1. Go to **"Billing"** in sidebar
2. Click **"Link a billing account"**
3. Add credit card (you get $300 free for 90 days!)
4. Won't be charged unless you exceed free tier

### Step 4: Add to .env (30 seconds)

Open `.env` and update:

```bash
# Enable Google Places
ENABLE_GOOGLE_PLACES=true

# Add your API key
GOOGLE_MAPS_API_KEY="AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q"
```

### Step 5: Restart & Test (30 seconds)

```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev

# Test it
# Go to: http://localhost:3000/restaurant-finder
# Click "Use My Location" → "Search Restaurants"
# You should see REAL restaurants! 🎉
```

---

## For Production (Vercel)

Add to Vercel environment variables:

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Add:
   ```
   GOOGLE_MAPS_API_KEY = AIzaSyA...
   ENABLE_GOOGLE_PLACES = true
   ```
3. **Redeploy**

---

## Cost

**Free Tier**: $200/month credit = ~10,000 searches

**Typical Usage**:
- 100 searches/month: **$0**
- 500 searches/month: **$0**
- 2,000 searches/month: **$0**

**For most users: FREE** ✅

---

## Troubleshooting

**"API key invalid"**
- Copy entire key (no spaces)
- Restart dev server

**"Not authorized for referrer"**
- Add `http://localhost:3000/*` to key restrictions
- Wait 5 minutes

**"Billing must be enabled"**
- Go to Billing → Link billing account
- Add credit card (won't be charged)

**Still having issues?**
- See `GOOGLE_PLACES_SETUP.md` for detailed guide

---

## Want to Stay Free?

Keep it as is:
```bash
ENABLE_GOOGLE_PLACES=false
```

Your app works perfectly without Google Places - just uses simulated data instead of real restaurants.

---

**Time**: 5-10 minutes

**Cost**: $0/month (for typical usage)

**Benefit**: Real restaurants with photos, ratings, and reviews!

---

For detailed instructions, see: **`GOOGLE_PLACES_SETUP.md`**
