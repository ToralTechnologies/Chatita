# 🧪 Testing Google Places API Locally

## ✅ Current Status

Your Google Places API is **ENABLED** and ready to test!

**Configuration:**
```bash
ENABLE_GOOGLE_PLACES=true
GOOGLE_MAPS_API_KEY="[your-google-api-key]"
```

**Server Status:** ✅ Running on http://localhost:3000

---

## 🚀 Step-by-Step Testing

### Test 1: Location-Based Search (Real Restaurants)

1. **Open the restaurant finder:**
   ```
   http://localhost:3000/restaurant-finder
   ```

2. **Click "Use My Location"**
   - Browser will ask for location permission
   - Click **"Allow"**

3. **Click "Search Restaurants"**

4. **What you should see:**
   - ✅ **Real restaurants** near your location
   - ✅ Actual **names** (not "Mediterranean Bistro")
   - ✅ Real **addresses**
   - ✅ Google **ratings** (stars)
   - ✅ **Distance** from your location
   - ✅ Actual restaurant **photos** (if available)

5. **Mode indicator:**
   - Look for the text at the bottom
   - Should say: `"Found X restaurants using Google Places API"`
   - NOT: `"Showing simulated restaurants ($0 mode)"`

---

### Test 2: Search by Dish

1. **In the search box, type:** `grilled chicken`

2. **Click "Search Restaurants"**

3. **What you should see:**
   - ✅ Real restaurants that serve grilled chicken
   - ✅ Diabetes-friendly tips specific to the dish
   - ✅ ADA recommendations
   - ✅ Google Places data combined with health tips

---

### Test 3: Try Different Locations

1. **Uncheck "Use My Location"**

2. **Type a city:** `Ann Arbor, MI` (or any city)

3. **Click "Search Restaurants"**

4. **What you should see:**
   - ✅ Restaurants in that city
   - ✅ Real data from Google Places
   - ✅ Distance calculated from that location

---

### Test 4: Check Browser Console

1. **Open Developer Tools** (Press F12)

2. **Go to Console tab**

3. **Click "Search Restaurants"**

4. **Look for:**
   - ✅ API request to `/api/restaurants/nearby`
   - ✅ Response with real restaurant data
   - ✅ No errors (red text)

**Example successful log:**
```javascript
{
  restaurants: [
    {
      id: "ChIJ...",  // Real Google Place ID
      name: "Sweetgreen",  // Real restaurant
      cuisine: "American",
      rating: 4.5,
      address: "123 Main St, Ann Arbor, MI"
      // ...
    }
  ],
  mode: "google",  // Using Google Places
  locationName: "Ann Arbor, MI"
}
```

---

## 🔍 Verify It's Using Google Places

### Check 1: Restaurant Names
**Simulated Mode:**
- Generic names: "Mediterranean Bistro", "Thai Kitchen"
- All have perfect 4.0-5.0 ratings
- Addresses like "1234 Main St"

**Google Places Mode:**
- Real names: "Chipotle", "Panera Bread", "Sweetgreen"
- Varied ratings (3.2, 4.7, etc.)
- Actual street addresses

### Check 2: Mode Indicator
Look at the bottom of the restaurant list:

**Simulated Mode:**
```
Showing simulated restaurants ($0 mode)
Want real restaurants? Enable Google Places API
```

**Google Places Mode:**
```
Found 15 restaurants using Google Places API
```

### Check 3: Data Consistency
**Simulated Mode:**
- Same restaurants each time
- Random distances
- No photos

**Google Places Mode:**
- Different restaurants based on actual location
- Real distances
- Photos from Google (if available)

---

## 🐛 Troubleshooting

### Issue: Seeing simulated restaurants

**Check:**
1. Verify `.env` has:
   ```bash
   ENABLE_GOOGLE_PLACES=true
   GOOGLE_MAPS_API_KEY="AIzaSyD..."
   ```

2. Restart dev server:
   ```bash
   # Press Ctrl+C in terminal
   npm run dev
   ```

3. Hard refresh browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

### Issue: "Failed to find nearby restaurants"

**Check console for errors:**

1. **"API key invalid"**
   - Verify key in `.env` is correct
   - No extra spaces
   - Wrapped in quotes

2. **"REQUEST_DENIED"**
   - API key not authorized
   - Enable Places API in Google Cloud Console
   - Check key restrictions

3. **"OVER_QUERY_LIMIT"**
   - Exceeded free tier
   - Check Google Cloud Console usage
   - Wait until quota resets

---

### Issue: Location permission denied

1. **Check browser settings:**
   - Click lock icon in address bar
   - Set "Location" to "Allow"

2. **Try manual location:**
   - Uncheck "Use My Location"
   - Type city name manually

---

### Issue: No restaurants shown

**Possible reasons:**

1. **Remote location:**
   - Try a major city
   - Example: `New York, NY` or `Los Angeles, CA`

2. **API errors:**
   - Check browser console (F12)
   - Look for red error messages

3. **Server not restarted:**
   ```bash
   npm run dev
   ```

---

## 📊 Compare Modes

### Simulated Mode ($0):
```javascript
{
  id: "simulated-0",
  name: "Mediterranean Bistro",
  cuisine: "Mediterranean",
  rating: 4.5,
  distance: "0.8 mi",
  address: "1234 Main St",
  mode: "$0"
}
```

### Google Places Mode:
```javascript
{
  id: "ChIJN1t_tDeuEmsRUsoyG83frY4",  // Real Place ID
  name: "Sweetgreen",  // Real restaurant
  cuisine: "American",
  rating: 4.7,  // Real rating
  distance: "0.3 mi",  // Calculated distance
  address: "123 State St, Ann Arbor, MI 48104",  // Real address
  phone: "(734) 555-0123",  // Real phone
  mode: "google"
}
```

---

## ✅ Success Checklist

Test these scenarios:

- [ ] Open restaurant finder page
- [ ] Allow location permission
- [ ] See real restaurant names (not generic)
- [ ] Verify "Google Places API" mode indicator
- [ ] Check real addresses and ratings
- [ ] Search by dish (e.g., "grilled chicken")
- [ ] Try different city (manual location)
- [ ] No errors in browser console
- [ ] Photos load (if available)
- [ ] Distance calculated correctly

**If all checked:** ✅ Google Places is working!

---

## 📝 Test Results Template

```
Test Date: January 30, 2026
Location Tested: _________________
API Key Status: ✅ Enabled

Test 1: Location Search
- Restaurants Found: ___
- Mode: [ ] Simulated  [ ] Google Places
- Real Names: [ ] Yes  [ ] No

Test 2: Dish Search
- Dish Searched: grilled chicken
- Results: ___
- Health Tips Shown: [ ] Yes  [ ] No

Test 3: Console Errors
- Errors: [ ] None  [ ] Some (describe below)

Notes:
_________________________________
_________________________________
```

---

## 🔧 Advanced Testing

### Test API Directly (cURL)

```bash
# Test location search
curl -X POST http://localhost:3000/api/restaurants/nearby \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "lat": 42.2808,
    "lng": -83.7430
  }'
```

**Expected response:**
```json
{
  "restaurants": [...],
  "mode": "google",
  "locationName": "Ann Arbor, MI"
}
```

### Check Google Places API Quota

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Click: **APIs & Services** → **Dashboard**
4. See requests per day graph

---

## 💡 Tips

### For Best Results:

1. **Use real locations:**
   - College campus
   - Downtown area
   - Shopping district

2. **Compare modes:**
   - Test with `ENABLE_GOOGLE_PLACES=false`
   - Then `ENABLE_GOOGLE_PLACES=true`
   - Notice the difference

3. **Check different times:**
   - Morning, afternoon, evening
   - Results may vary by opening hours

4. **Try dish searches:**
   - "grilled chicken"
   - "salmon"
   - "salad"
   - "greek yogurt"

---

## 📈 Monitor Usage

**Check your Google Cloud Console:**

1. **Today's requests:** Should show API calls
2. **Cost:** Should be $0 (free tier)
3. **Errors:** Should be 0%

**Set alerts:**
- Go to Billing → Budgets
- Create budget: $5
- Get email if exceeded

---

## 🎯 What to Look For

### ✅ Google Places Working:
- Real restaurant names
- Accurate addresses
- Actual ratings from Google
- Photos (when available)
- Phone numbers
- "Google Places API" mode indicator

### ❌ Still in Simulated Mode:
- Generic names ("Mediterranean Bistro")
- Fake addresses ("1234 Main St")
- Perfect ratings (4.5, 5.0)
- "$0 mode" indicator
- No photos

---

## 🚀 Next Steps After Testing

Once confirmed working:

1. **Deploy to Vercel:**
   - Add `GOOGLE_MAPS_API_KEY` to Vercel env vars
   - Set `ENABLE_GOOGLE_PLACES=true`
   - Update API key restrictions for production domain

2. **Monitor costs:**
   - Check Google Cloud Console weekly
   - Most apps stay in free tier

3. **Optimize:**
   - Cache results for 1 hour
   - Limit search radius
   - Set max results

---

**Your Google Places API is ready to test!** 🗺️

Visit: **http://localhost:3000/restaurant-finder** and start testing!
