// AI-powered meal analysis using Claude (Anthropic) vision
// Only works when ENABLE_AI_ANALYSIS=true

interface MealAnalysisResult {
  detectedFoods: string[];
  nutrition: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  portionSize?: string;
  confidence: number;
  mode: 'ai' | '$0';
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
        model: 'claude-3-5-sonnet-20241022',
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
                text: `You are a nutrition expert analyzing meal photos for people with diabetes following ADA (American Diabetes Association) guidelines.

Analyze this meal image and return ONLY a valid JSON object (no markdown, no code blocks, just the JSON) with:

1. detectedFoods: Array of specific food items detected (e.g., "grilled chicken breast", "steamed broccoli", "brown rice")
2. nutrition: Object with estimated nutritional values:
   - calories (number): total estimated calories
   - carbs (number): carbohydrates in grams
   - protein (number): protein in grams
   - fat (number): fat in grams
   - fiber (number): fiber in grams (important for diabetes)
   - sugar (number): sugar in grams
   - sodium (number): sodium in mg
3. portionSize: Estimated total serving size (e.g., "1 cup", "6 oz", "1 medium plate")
4. confidence: Your confidence level 0-100 in this analysis

IMPORTANT:
- Be conservative with estimates
- Focus on carbs and fiber (critical for blood sugar management)
- If you can't see clearly, lower your confidence score
- Return ONLY the JSON object, nothing else

Example format:
{
  "detectedFoods": ["grilled chicken breast", "steamed broccoli", "quinoa"],
  "nutrition": {
    "calories": 450,
    "carbs": 35,
    "protein": 40,
    "fat": 12,
    "fiber": 8,
    "sugar": 3,
    "sodium": 650
  },
  "portionSize": "1 medium plate",
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

    return {
      detectedFoods: result.detectedFoods || [],
      nutrition: result.nutrition || {},
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
