# 🤖 AI Meal Enhancement Feature

## Overview

Added AI-powered enhancement for manually logged meals (text-only, no photo) that:
- Estimates nutrition values based on food description
- Asks clarifying questions for better accuracy
- Provides diabetes-friendly tips specific to the meal
- Tracks restaurant location when meal is from a restaurant

## New Features

### 1. AI Enhancement for Text-Only Meals

**When to use:**
- User adds a meal without taking a photo
- User types in foods manually (e.g., "grilled chicken", "salad")
- AI provides nutrition estimates and asks clarifying questions

**How it works:**
1. User adds foods to the meal form
2. Clicks **"Get AI Nutrition Estimates & Tips"** button
3. AI analyzes the foods and:
   - Asks 2-3 clarifying questions (portion size, cooking method, ingredients)
   - Provides nutrition estimates (calories, carbs, protein, fat, fiber, sugar)
   - Shows confidence level (low/medium/high)
   - Gives diabetes-friendly tips specific to the meal
4. Nutrition values are auto-filled in the form (user can edit)

**Example:**

```
User inputs: "grilled chicken, brown rice, broccoli"

AI Response:
Questions:
- How was the chicken prepared (grilled, fried, baked)?
- What was the approximate portion size (e.g., size of your palm, 1 cup)?
- Were there any sauces or dressings?

Nutrition Estimate (medium confidence):
- Calories: 350
- Carbs: 25g
- Protein: 35g
- Fat: 12g
- Fiber: 5g

Diabetes Tips:
- Great protein choice! Grilled chicken is lean and won't spike blood sugar.
- Brown rice is a better choice than white rice - it has more fiber.
- Broccoli is a non-starchy vegetable - eat freely!
```

### 2. Restaurant Location Tracking

**When to use:**
- User ate at a restaurant and wants to track where
- Helps identify favorite diabetes-friendly spots
- Useful for finding patterns

**How it works:**
1. User clicks **"+ Add Restaurant Location"** in the meal form
2. Enters restaurant name and address
3. Data is saved with the meal
4. Can view restaurant history in meal history

**Fields:**
- `restaurantName` - Name of the restaurant (e.g., "Chipotle")
- `restaurantAddress` - Address (e.g., "123 Main St, Ann Arbor, MI")
- `restaurantPlaceId` - Google Place ID (for future integration)

## Technical Implementation

### Database Changes

**New fields in `Meal` model** (`prisma/schema.prisma:89-92`):
```prisma
restaurantName    String? // Name of restaurant if meal was from restaurant
restaurantAddress String? // Address of restaurant
restaurantPlaceId String? // Google Place ID for reference
```

**Migration:** `20260131062456_add_restaurant_location_to_meals`

### API Endpoint

**New endpoint:** `POST /api/enhance-meal`

**Request:**
```json
{
  "description": "grilled chicken, brown rice, broccoli",
  "foods": ["grilled chicken", "brown rice", "broccoli"],
  "mealType": "lunch",
  "portionSize": "1 cup"
}
```

**Response:**
```json
{
  "mode": "ai",
  "questions": [
    "How was the chicken prepared?",
    "What was the portion size?",
    "Were there any sauces?"
  ],
  "nutritionEstimate": {
    "calories": 350,
    "carbs": 25,
    "protein": 35,
    "fat": 12,
    "fiber": 5,
    "sugar": 3,
    "confidence": "medium",
    "note": "Estimates based on typical portions. Actual values may vary."
  },
  "diabetesTips": [
    "Great protein choice!",
    "Brown rice has more fiber than white rice.",
    "Broccoli is a non-starchy vegetable."
  ],
  "suggestions": [
    "Add portion size for more accurate estimates"
  ]
}
```

### UI Components

**Updated:** `components/meal-form.tsx`

**New UI elements:**
1. **AI Enhancement Button** (line 161-175)
   - Only shows when user has added foods but no photo
   - Blue button with robot emoji 🤖
   - Shows loading state while AI is working

2. **AI Enhancement Results** (line 177-226)
   - Purple box for clarifying questions
   - Green box for nutrition estimates
   - Blue box for diabetes tips

3. **Restaurant Location Section** (line 229-262)
   - Collapsible section: "+ Add Restaurant Location"
   - Input for restaurant name
   - Input for address
   - Help text explaining the feature

**Updated:** `app/api/meals/route.ts:48-66`
- Added `restaurantName`, `restaurantAddress`, `restaurantPlaceId` to request body
- Saves restaurant data when creating meal

## User Flow

### Scenario 1: Manual Meal Entry with AI Enhancement

1. User goes to "Add Meal"
2. Skips taking a photo
3. Types in foods: "grilled salmon, quinoa, asparagus"
4. Clicks **"Get AI Nutrition Estimates & Tips"**
5. AI asks clarifying questions and provides estimates
6. Nutrition values are auto-filled
7. User can edit or accept them
8. User saves meal

### Scenario 2: Restaurant Meal with Location

1. User goes to "Add Meal"
2. Takes photo of restaurant meal OR enters foods manually
3. Clicks **"+ Add Restaurant Location"**
4. Enters:
   - Restaurant Name: "Chipotle"
   - Address: "123 Main St, Ann Arbor, MI"
5. User saves meal
6. Can later see all meals from "Chipotle" in history

## Cost Considerations

**AI Enhancement API:**
- Uses Claude 3.5 Sonnet
- ~1,000 tokens per request
- Cost: ~$0.003 per enhancement
- Only triggered when user clicks the button (not automatic)

**Recommendation:**
- This is optional and user-initiated
- Users without AI credits can still enter nutrition manually
- Falls back gracefully if AI is disabled

## Future Enhancements

1. **Restaurant Autocomplete**
   - Integrate with Google Places Autocomplete
   - Auto-fill address when user types restaurant name

2. **Restaurant History**
   - Show "Recent Restaurants" list
   - One-click to add meal from favorite restaurant

3. **Smart Suggestions**
   - "You've eaten at Chipotle 5 times - your go-to order is..."
   - Suggest diabetes-friendly options based on past meals

4. **Nutrition Database**
   - Cache common foods/restaurants
   - Faster estimates without API calls

## Testing

### Test AI Enhancement

1. Go to: http://localhost:3000/add-meal
2. Skip photo
3. Add foods: "grilled chicken", "salad"
4. Click "Get AI Nutrition Estimates & Tips"
5. Verify:
   - Questions appear
   - Nutrition estimates show
   - Diabetes tips display
   - Values auto-fill in form

### Test Restaurant Location

1. Go to: http://localhost:3000/add-meal
2. Add any meal
3. Click "+ Add Restaurant Location"
4. Enter:
   - Name: "Test Restaurant"
   - Address: "123 Test St"
5. Save meal
6. Check meal history - verify restaurant info appears

## Configuration

**Enable AI Enhancement:**
```bash
# .env
ENABLE_AI_ANALYSIS=true
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Disable AI Enhancement:**
```bash
# .env
ENABLE_AI_ANALYSIS=false
```

When disabled, the AI Enhancement button won't show, and users enter nutrition manually.

---

**Summary:**
- ✅ AI enhancement for text-only meals
- ✅ Restaurant location tracking
- ✅ Clarifying questions for better accuracy
- ✅ Diabetes-friendly tips
- ✅ Auto-fill nutrition values
- ✅ Graceful fallback when AI is disabled
