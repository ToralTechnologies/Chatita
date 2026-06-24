// AI-powered meal analysis using Claude (Anthropic) vision
// Only works when ENABLE_AI_ANALYSIS=true

interface MealAnalysisResult {
  detectedFoods: string[];
  allDetectedDishes?: string[]; // All dishes visible in photo
  needsSelection?: boolean; // True if user needs to select which dishes are theirs
  aiSummary?: string; // Human-readable summary: "chicken tacos with salsa"
  mealType?: string; // Auto-detected: breakfast, lunch, dinner, snack
  nutrition: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  mealBalance?: {
    balanceScore: 'well-balanced' | 'mostly-balanced' | 'needs-balance';
    balanceReason: string;
    portionGuidance: string;
    culturalNote: string | null;
  };
  nutritionSummary?: string; // "~35g carbs • 8g fiber • 40g protein • 450 cal"
  portionSize?: string;
  confidence: number;
  mode: 'ai' | '$0';
}

// Helper function to auto-detect meal type based on timestamp
function detectMealType(timestamp: Date = new Date()): string {
  const hour = timestamp.getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 || hour < 5) return 'dinner';

  return 'snack'; // fallback
}

export async function analyzeMealPhoto(photoBase64: string): Promise<MealAnalysisResult> {
  // Check if AI is enabled
  const aiEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';

  if (!aiEnabled) {
    // Return $0 mode - manual entry required
    return {
      detectedFoods: [],
      nutrition: {},
      confidence: 0,
      mode: '$0',
    };
  }

  // AI Mode - Use Claude (Anthropic) vision
  try {
    // Extract image data from base64 (remove data:image/xxx;base64, prefix if present)
    const imageData = photoBase64.includes('base64,')
      ? photoBase64.split('base64,')[1]
      : photoBase64;

    // Detect media type from base64 prefix
    let mediaType = 'image/jpeg'; // default
    if (photoBase64.includes('data:image/')) {
      const match = photoBase64.match(/data:image\/(.*?);base64/);
      if (match) {
        mediaType = `image/${match[1]}`;
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: `You are a nutrition expert analyzing meal photos for people with diabetes, following ADA (American Diabetes Association) guidelines. Your approach is culturally sensitive and balance-focused — you celebrate food from all cultures and focus on balance, not restriction.

Analyze this meal image and return ONLY a valid JSON object (no markdown, no code blocks, just the JSON) with:

1. allDetectedDishes: Array of ALL food items/dishes visible in the photo
   - Include everything visible: their meal, other people's food, shared dishes
   - Be specific AND culturally accurate (e.g., "carne asada taco", "biryani rice", "dal tadka", "pho bo")

2. needsSelection: boolean - true if multiple distinct dishes/meals are visible (likely not all for the user)

3. detectedFoods: Array of most likely food items for the user

4. aiSummary: Short, friendly human-readable summary (e.g., "chicken biryani with raita", "carne asada tacos with beans")
   - Be culturally specific — name the actual dish, not a generic Western equivalent
   - 3-7 words

5. nutrition: Estimated nutritional values FOR THE DETECTED USER MEAL:
   - calories (number)
   - carbs (number): grams — this is a PRIMARY metric
   - protein (number): grams — this is a PRIMARY metric
   - fat (number): grams
   - fiber (number): grams — this is a PRIMARY metric (fiber slows glucose absorption)
   - sugar (number): grams
   - sodium (number): mg

6. mealBalance: An assessment of the meal's overall balance:
   - balanceScore: "well-balanced" | "mostly-balanced" | "needs-balance"
   - balanceReason: WHY (e.g., "Good protein and fiber, moderate carbs" or "High carbs, low fiber and protein — consider adding beans or vegetables")
   - portionGuidance: Practical visual portion guidance (e.g., "Rice portion looks about 1 cup — a half cup would slow glucose impact")
   - culturalNote: If this is a cultural dish, how to enjoy it while supporting blood sugar (NEVER suggest replacing the dish — suggest portion or preparation adjustments)

7. portionSize: Estimated serving size (e.g., "1 cup rice + 4oz chicken")

8. confidence: Your confidence 0-100

KEY PRINCIPLES:
- Fiber is as important as carbs. A meal with 8g fiber and 45g carbs is MUCH better than 45g carbs with 0g fiber.
- Low carb alone does NOT mean a good meal. Protein alone (e.g., plain chicken) without fiber or carbs is not balanced.
- NEVER suggest replacing cultural foods. Instead suggest portion adjustments or complementary additions.
- Be conservative with estimates.

Example (cultural meal):
{
  "allDetectedDishes": ["chicken biryani", "raita", "sliced cucumber"],
  "needsSelection": false,
  "detectedFoods": ["chicken biryani", "raita"],
  "aiSummary": "chicken biryani with raita",
  "nutrition": {
    "calories": 520,
    "carbs": 65,
    "protein": 28,
    "fat": 14,
    "fiber": 4,
    "sugar": 5,
    "sodium": 780
  },
  "mealBalance": {
    "balanceScore": "mostly-balanced",
    "balanceReason": "Good protein from chicken, but fiber is low. The raita adds calcium and probiotics.",
    "portionGuidance": "Rice portion looks about 1.5 cups — try 1 cup next time and add the extra cucumber salad to fill up.",
    "culturalNote": "Biryani is a complete meal. Enjoy it — adding a side salad or extra raita boosts fiber without changing the dish."
  },
  "portionSize": "1.5 cups biryani + 3oz raita",
  "confidence": 72
}

Example (simple meal):
{
  "allDetectedDishes": ["grilled chicken breast", "steamed broccoli", "brown rice"],
  "needsSelection": false,
  "detectedFoods": ["grilled chicken breast", "steamed broccoli", "brown rice"],
  "aiSummary": "grilled chicken with broccoli and rice",
  "nutrition": {
    "calories": 450,
    "carbs": 35,
    "protein": 40,
    "fat": 12,
    "fiber": 8,
    "sugar": 3,
    "sodium": 650
  },
  "mealBalance": {
    "balanceScore": "well-balanced",
    "balanceReason": "Great protein (40g), good fiber (8g), and moderate carbs — a well-balanced plate that will support steady blood sugar.",
    "portionGuidance": "Portions look right-sized. Rice is about 1/2 cup, chicken about 4oz.",
    "culturalNote": null
  },
  "portionSize": "4oz chicken + 1/2 cup rice + 1 cup broccoli",
  "confidence": 85
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Extract the content from Claude's response
    const content = data.content?.[0]?.text || '';

    // Parse JSON from the response (handle potential markdown code blocks)
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    // Auto-detect meal type based on current time
    const mealType = detectMealType();

    // Generate nutrition summary — fiber and protein are now primary metrics alongside carbs
    const { carbs, fiber, protein, calories } = result.nutrition ?? {};
    const summaryParts: string[] = [];
    if (carbs != null) summaryParts.push(`~${Math.round(carbs)}g carbs`);
    if (fiber != null) summaryParts.push(`${Math.round(fiber)}g fiber`);
    if (protein != null) summaryParts.push(`${Math.round(protein)}g protein`);
    if (calories != null) summaryParts.push(`${Math.round(calories)} cal`);
    const nutritionSummary = summaryParts.join(' • ');

    return {
      detectedFoods: result.detectedFoods || [],
      allDetectedDishes: result.allDetectedDishes || [],
      needsSelection: result.needsSelection || false,
      aiSummary: result.aiSummary,
      mealType,
      nutrition: result.nutrition || {},
      mealBalance: result.mealBalance,
      nutritionSummary,
      portionSize: result.portionSize,
      confidence: result.confidence || 0,
      mode: 'ai',
    };
  } catch (error) {
    console.error('Claude meal analysis error:', error);

    // Fallback to manual mode if AI fails
    return {
      detectedFoods: [],
      nutrition: {},
      confidence: 0,
      mode: '$0',
    };
  }
}
