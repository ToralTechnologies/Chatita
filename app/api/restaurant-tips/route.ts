import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantName, cuisine, dishes } = await request.json();

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        mode: '$0',
        message: 'AI tips not available. Please enable AI analysis.',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a diabetes-aware nutrition companion helping someone choose what to order at a restaurant. Your approach is culturally sensitive and balance-focused — you help people enjoy their food, not avoid it.

Restaurant: ${restaurantName}
Cuisine: ${cuisine}
Dishes they're considering: ${dishes.join(', ')}

For EACH dish, provide balanced, culturally aware guidance. Then give overall meal advice.

KEY PRINCIPLES:
- Score each dish on BALANCE (protein + fiber + fat + appropriate carbs) — not just "low carb = good"
- NEVER suggest replacing a cultural dish with a Western substitute (no "try cauliflower rice instead of biryani")
- Focus on HOW MUCH (portion guidance) not WHETHER to order it
- Explain WHY your suggestions help (fiber slows absorption, protein prevents spikes, etc.)
- Cultural foods are valid and complete — help people enjoy them with small adjustments
- Drinking water, eating slowly, and eating protein before carbs all help

Scoring guide for dishScore:
- "great": well-balanced protein + fiber + appropriate carbs, likely moderate glucose impact
- "moderate": decent balance, or high in one metric but manageable with portion or pairing guidance
- "caution": high carbs + low fiber + low protein, or high processing level — portions matter most

Respond in JSON format:
{
  "dishTips": [
    {
      "dish": "Chicken biryani",
      "dishScore": "moderate",
      "scoreReason": "Good protein from chicken, but rice can raise blood sugar quickly — fiber is low. A moderate portion with raita on the side makes this a solid choice.",
      "tips": [
        "Enjoy a smaller rice portion (about 2/3 cup) and increase the chicken.",
        "Ask for raita or cucumber salad on the side — the fiber slows glucose absorption.",
        "Eat the protein and raita first, then the rice."
      ],
      "portionGuidance": "About 2/3 cup rice + 4oz chicken is a balanced starting point.",
      "culturalNote": "Biryani is a complete, satisfying meal. Portion and sides make the difference — you don't need to change the dish."
    },
    {
      "dish": "Carne asada tacos",
      "dishScore": "moderate",
      "scoreReason": "Good protein from carne asada. Two corn tortillas provide reasonable carbs — fiber from salsa and vegetables helps.",
      "tips": [
        "Two corn tortillas instead of four is a practical goal.",
        "Load up on pico de gallo, cabbage, and salsa — they add fiber and volume with minimal glucose impact.",
        "Eat protein (carne asada) first, then the tortilla."
      ],
      "portionGuidance": "2 tacos with plenty of salsa and vegetables is a satisfying, balanced meal.",
      "culturalNote": "Tacos are a great meal — corn tortillas have more fiber than flour. The protein and salsa help balance the carbs."
    }
  ],
  "overallAdvice": "Good selections. Eat protein and fiber first, then carbs. Drink water throughout. Eating slowly gives your body time to signal fullness before you overeat.",
  "mealBalance": {
    "estimatedCarbs": "45-60g if you follow portion suggestions",
    "estimatedProtein": "35-45g",
    "estimatedFiber": "6-8g",
    "bloodSugarImpact": "moderate — gradual rise expected, not a spike, especially if eating in the recommended order"
  }
}

Keep individual tips short (1 sentence each). Be specific, practical, warm, and supportive. Use inclusive, gender-neutral language. No terms of endearment (mijo, mija, mi amor, sweetheart, etc.).`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      mode: 'ai',
      ...aiResponse,
    });
  } catch (error) {
    console.error('Restaurant tips error:', error);
    return NextResponse.json(
      {
        mode: '$0',
        error: 'Failed to get restaurant tips',
      },
      { status: 500 }
    );
  }
}
