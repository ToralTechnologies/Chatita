# 🎯 Restaurant Dish Selector Feature

## Overview

Added an interactive dish selector that allows users to:
- Select multiple dishes from a restaurant's menu
- Get personalized diabetes-friendly ordering tips for each dish
- Receive overall meal advice and estimated carb counts
- Make informed decisions before ordering

## How It Works

### User Flow

1. **Find restaurants** (by location or dish search)
2. **Expand dish selector** - Click "🎯 Select dishes for personalized tips"
3. **Select dishes** - Choose multiple menu items you're considering
4. **Get AI tips** - Click "Get Diabetes-Friendly Tips for Selected Dishes"
5. **Review personalized advice**:
   - Specific tips for each dish
   - How to modify orders
   - Overall meal advice
   - Estimated carb count
   - Blood sugar impact

### Example Usage

**Scenario**: User finds Chipotle and is deciding what to order

1. User selects:
   - Burrito bowl
   - Chicken
   - Brown rice
   - Black beans

2. AI provides:

```
🍽️ Burrito bowl
• Skip the tortilla - saves 45g carbs, mi amor!
• Use the bowl as your portion guide
• Load up with fajita veggies (free food!)

🍽️ Chicken
• Perfect lean protein choice
• Grilled chicken won't spike blood sugar
• Ask for double protein to stay fuller longer

🍽️ Brown rice
• Limit to 1/2 cup (about the size of your fist)
• Brown rice > white rice (more fiber)
• Consider skipping rice entirely if having beans

🍽️ Black beans
• Great fiber source (7g per serving)
• Beans + protein = slow, steady energy
• Beans count as carbs - budget accordingly

💡 Overall Advice:
Focus on protein first, then veggies, then choose either rice OR beans
(not both) to keep carbs in check. This balanced meal should keep you
satisfied for 3-4 hours without big blood sugar swings.

Estimated Carbs: 35-45g total (if you follow portion suggestions)
Blood Sugar Impact: moderate - gradual rise, not spike
```

## Technical Implementation

### Frontend Changes

**File**: `app/(main)/restaurant-finder/page.tsx`

**New State**:
```typescript
const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
const [gettingTips, setGettingTips] = useState(false);
const [customTips, setCustomTips] = useState<Record<string, any>>({});
```

**New Functions**:
```typescript
// Toggle dish selection
toggleDishSelection(restaurantId: string, dish: string)

// Get personalized tips from AI
getCustomTips(restaurantId: string, restaurantName: string, cuisine: string)
```

**New UI Components** (lines 310-383):
1. **Expandable dish selector button**
   - "🎯 Select dishes for personalized tips"
   - Expands/collapses dish selection interface

2. **Dish selection buttons**
   - Shows all recommended dishes
   - Multi-select with checkmarks
   - Highlights selected dishes in primary color

3. **"Get Tips" button**
   - Only shows when dishes are selected
   - Loading state while AI processes
   - Disabled during loading

4. **Custom tips display**
   - Beautiful gradient card
   - Per-dish tips with bullet points
   - Overall advice section
   - Estimated carbs and blood sugar impact

### Backend API

**New Endpoint**: `POST /api/restaurant-tips`

**Request**:
```json
{
  "restaurantName": "Chipotle",
  "cuisine": "Mexican",
  "dishes": [
    "Burrito bowl",
    "Grilled chicken",
    "Brown rice",
    "Black beans"
  ]
}
```

**Response**:
```json
{
  "mode": "ai",
  "dishTips": [
    {
      "dish": "Burrito bowl",
      "tips": [
        "Skip the tortilla - saves 45g carbs, mi amor!",
        "Use the bowl as your portion guide",
        "Load up with fajita veggies (free food!)"
      ]
    },
    {
      "dish": "Grilled chicken",
      "tips": [
        "Perfect lean protein choice",
        "Grilled chicken won't spike blood sugar",
        "Ask for double protein to stay fuller longer"
      ]
    }
  ],
  "overallAdvice": "Focus on protein first, then veggies...",
  "estimatedCarbs": "35-45g total",
  "bloodSugarImpact": "moderate - gradual rise, not spike"
}
```

**AI Prompt Design**:
- Requests specific tips for EACH dish
- Focuses on practical modifications
- Includes portion guidance
- Provides overall meal strategy
- Estimates total carbs and blood sugar impact
- Uses supportive, culturally aware tone

## Features

### Per-Dish Tips

For each selected dish, AI provides:
- ✅ **Portion control guidance** - "Limit to 1/2 cup"
- ✅ **Modification suggestions** - "Ask for dressing on side"
- ✅ **Healthy swaps** - "Consider cauliflower rice"
- ✅ **Blood sugar impact** - "Won't spike blood sugar"
- ✅ **Pairing advice** - "Pair with protein"

### Overall Meal Advice

- 🎯 **Eating strategy** - Which foods to eat first
- 📊 **Estimated carb count** - Total carbs if following suggestions
- 📈 **Blood sugar prediction** - Expected glucose impact
- ⏱️ **Satiety estimate** - How long you'll feel full
- 💡 **General tips** - Drink water, eat slowly, etc.

### Smart Recommendations

AI considers:
1. **Individual dish characteristics** - Protein, carbs, fat, fiber
2. **Meal composition** - Balance of macros across all dishes
3. **Portion sizes** - Visual guides (fist, palm, deck of cards)
4. **Diabetes management** - ADA guidelines, glycemic impact
5. **Cultural sensitivity** - Uses "mi amor", understands Latino cuisine

## UI/UX Design

### Visual Hierarchy

1. **Expandable section** - Doesn't clutter restaurant card
2. **Chip-style buttons** - Easy to tap, clear selection state
3. **Gradient tips card** - Visually distinct from general tips
4. **Per-dish grouping** - Easy to scan specific items
5. **Overall advice callout** - Blue background for emphasis

### Interaction Patterns

- **Multi-select** - Choose 1-10 dishes
- **Progressive disclosure** - Tips only show after request
- **Loading states** - Clear feedback during API call
- **Error handling** - Graceful fallback if AI unavailable

### Color Coding

- **Selected dishes**: Primary blue background
- **Unselected dishes**: Gray background
- **Tips card**: Blue-purple gradient
- **Per-dish sections**: White cards
- **Overall advice**: Blue background

## Use Cases

### Scenario 1: Quick Service Restaurant
User at Chipotle/Panera selecting a combo meal
- Selects: bowl, protein, sides
- Gets: portion sizes, healthy swaps, skip recommendations

### Scenario 2: Sit-Down Restaurant
User at Italian restaurant browsing menu
- Selects: appetizer, entree, side
- Gets: sharing suggestions, pasta alternatives, sauce modifications

### Scenario 3: Fast Food
User at burger place trying to make best choice
- Selects: burger, fries, drink
- Gets: lettuce wrap option, portion limits, sugar-free drink suggestion

### Scenario 4: Ethnic Cuisine
User at Thai/Indian restaurant unfamiliar with dishes
- Selects: several dishes they don't recognize
- Gets: carb content, hidden sugars, diabetes-friendly choices

## Cost Considerations

**AI API Usage**:
- Model: Claude 3.5 Sonnet
- Tokens per request: ~1,500 tokens
- Cost: ~$0.005 per tip request
- Only triggered when user clicks button (not automatic)

**Optimization**:
- Cache common restaurant/dish combinations
- Limit to 10 dishes per request
- User must explicitly request tips

## Future Enhancements

### 1. Save Favorite Combos
```
User saves "My Usual Chipotle Order"
- Bowl, chicken, fajita veggies, salsa
- Tips always available offline
```

### 2. Nutrition Database Integration
```
Look up actual nutrition from restaurant menu APIs
- More accurate carb counts
- Real calorie data
- Allergen information
```

### 3. Compare Dishes
```
"Pasta Primavera" vs "Grilled Salmon"
Side-by-side comparison:
- Carbs: 65g vs 15g
- Protein: 18g vs 35g
- Best for diabetes: ✓ Grilled Salmon
```

### 4. Blood Sugar Predictions
```
Based on user's history at this restaurant:
"When you ate here before, your blood sugar rose by 40 mg/dL"
"Try limiting rice this time to stay in range"
```

### 5. Quick Reorder
```
"Order what you had last time at Chipotle?"
[Tap to select same dishes instantly]
```

## Testing

### Test the Feature

1. **Go to**: http://localhost:3000/restaurant-finder
2. **Search** for restaurants (by location or dish)
3. **Expand** any restaurant card
4. **Click**: "🎯 Select dishes for personalized tips"
5. **Select** 2-3 dishes by clicking them (they turn blue)
6. **Click**: "Get Diabetes-Friendly Tips"
7. **Wait** 2-3 seconds for AI response
8. **Review** personalized tips

### Verify Features

- [ ] Dish selector expands/collapses
- [ ] Dishes can be multi-selected
- [ ] Selected dishes show checkmark and blue background
- [ ] "Get Tips" button only shows when dishes selected
- [ ] Loading state shows during API call
- [ ] Tips display with per-dish sections
- [ ] Overall advice shows at bottom
- [ ] Estimated carbs and blood sugar impact included
- [ ] Tips are specific to selected dishes
- [ ] Cultural tone ("mi amor") present

## Configuration

**Enable Feature**:
```bash
# .env
ENABLE_AI_ANALYSIS=true
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Disable Feature**:
```bash
# .env
ENABLE_AI_ANALYSIS=false
```

When disabled, the dish selector still shows but button says "AI tips not available".

---

**Summary**:
- ✅ Interactive multi-select dish picker
- ✅ AI-powered personalized tips per dish
- ✅ Overall meal advice and carb estimates
- ✅ Blood sugar impact predictions
- ✅ Practical modification suggestions
- ✅ Beautiful, intuitive UI
- ✅ Works with both search methods
- ✅ Cost-effective (user-triggered only)
