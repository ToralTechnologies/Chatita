// AI-powered meal analysis using Claude (Anthropic) vision
// Only works when ENABLE_AI_ANALYSIS=true

export interface MealGuidance {
  tone: 'great' | 'mindful' | 'treat';
  kicker: string;
  headline: string;
  summary: string;
  order: { label: string; note: string }[];
  tips: { icon: 'leaf' | 'walk' | 'water' | 'heart'; text: string }[];
}

export interface MealAnalysisResult {
  detectedFoods: string[];
  allDetectedDishes?: string[];
  needsSelection?: boolean;
  aiSummary?: string;
  mealType?: string;
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
  guidance?: MealGuidance;
  nutritionSummary?: string;
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

const MEAL_PROMPT_BODY = `You are a warm, culturally-sensitive nutrition companion for people with diabetes. Use global diabetes education principles from the International Diabetes Federation (IDF) and World Health Organization (WHO) as your baseline. Adapt guidance to the user's cultural foods and context. Respond ONLY with a valid JSON object — no markdown, no code blocks.

Return these fields:

1. allDetectedDishes: string[] — every dish/item visible
2. needsSelection: boolean — true if multiple unrelated meals visible
3. detectedFoods: string[] — items for this user's meal
4. aiSummary: string — 3-7 word culturally-specific summary (e.g. "chicken biryani with raita")
5. nutrition: { calories, carbs, protein, fat, fiber, sugar, sodium } — numbers in grams/mg
6. mealBalance: { balanceScore: "well-balanced"|"mostly-balanced"|"needs-balance", balanceReason: string, portionGuidance: string, culturalNote: string|null }
7. portionSize: string
8. confidence: number (0-100)
9. guidance: {
     tone: "great"|"mindful"|"treat",
     kicker: string (2-3 words, celebratory — e.g. "Great choice", "Looks delicious", "A tasty treat"),
     headline: string (6-12 words in warm companion voice, not preachy),
     summary: string (same as aiSummary),
     order: [{ label: string (3-5 words, what to eat), note: string (6-12 words, why) }] (2-4 steps),
     tips: [{ icon: "leaf"|"walk"|"water"|"heart", text: string (1-2 sentences) }] (2-3 tips)
   }

Tone rules:
- "great": well-balanced, good fiber + protein + moderate carbs
- "mindful": moderate glycemic load, some awareness helpful
- "treat": high carbs/fat, low fiber — enjoy occasionally, practical tips to balance it

Icon rules: leaf=fiber/veg advice, walk=post-meal activity, water=hydration, heart=general positive

KEY PRINCIPLES:
- Never shame food. Never suggest replacing cultural dishes — suggest portion or prep adjustments.
- Fiber is as important as carbs. Protein matters too.
- Eating order tips: fiber → protein → carbs softens blood sugar impact.`;

function buildMealPrompt(mode: 'photo' | 'text'): string {
  if (mode === 'photo') return MEAL_PROMPT_BODY;
  return MEAL_PROMPT_BODY + '\n\nAnalyze the meal described below and return the JSON.';
}

function buildResult(result: Record<string, unknown>, mealType: string): MealAnalysisResult {
  const nutrition = (result.nutrition as Record<string, number>) ?? {};
  const { carbs, fiber, protein, calories } = nutrition;
  const summaryParts: string[] = [];
  if (carbs != null) summaryParts.push(`~${Math.round(carbs)}g carbs`);
  if (fiber != null) summaryParts.push(`${Math.round(fiber)}g fiber`);
  if (protein != null) summaryParts.push(`${Math.round(protein)}g protein`);
  if (calories != null) summaryParts.push(`${Math.round(calories)} cal`);
  return {
    detectedFoods: (result.detectedFoods as string[]) || [],
    allDetectedDishes: (result.allDetectedDishes as string[]) || [],
    needsSelection: (result.needsSelection as boolean) || false,
    aiSummary: result.aiSummary as string | undefined,
    mealType,
    nutrition,
    mealBalance: result.mealBalance as MealAnalysisResult['mealBalance'],
    guidance: result.guidance as MealGuidance | undefined,
    nutritionSummary: summaryParts.join(' • '),
    portionSize: result.portionSize as string | undefined,
    confidence: (result.confidence as number) || 0,
    mode: 'ai',
  };
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
                text: buildMealPrompt('photo'),
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

    return buildResult(result, mealType);
  } catch (error) {
    console.error('Claude meal analysis error:', error);
    return { detectedFoods: [], nutrition: {}, confidence: 0, mode: '$0' };
  }
}

export async function analyzeMealText(foods: string[]): Promise<MealAnalysisResult> {
  const aiEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';
  if (!aiEnabled) return { detectedFoods: foods, nutrition: {}, confidence: 0, mode: '$0' };

  try {
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
            content: `${buildMealPrompt('text')}

The meal contains: ${foods.join(', ')}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.statusText}`);

    const data = await response.json();
    let jsonStr = (data.content?.[0]?.text || '').trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');

    const result = JSON.parse(jsonStr);
    const mealType = detectMealType();
    return buildResult({ ...result, detectedFoods: result.detectedFoods?.length ? result.detectedFoods : foods }, mealType);
  } catch (error) {
    console.error('Claude text meal analysis error:', error);
    return { detectedFoods: foods, nutrition: {}, confidence: 0, mode: '$0' };
  }
}
