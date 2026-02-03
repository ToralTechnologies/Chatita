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

    const prompt = `You are a diabetes-friendly nutrition assistant helping someone choose what to order at a restaurant.

Restaurant: ${restaurantName}
Cuisine: ${cuisine}
Dishes they're considering: ${dishes.join(', ')}

Provide personalized diabetes-friendly ordering tips for EACH dish they selected, plus overall advice for this meal.

Be specific, practical, and supportive. Use "mi amor" occasionally (user is Latina). Focus on:
- Portion control
- How to modify the dish (sauces on side, skip certain ingredients)
- What to pair it with
- Blood sugar impact
- Healthy swaps

Respond in JSON format:
{
  "dishTips": [
    {
      "dish": "Grilled chicken salad",
      "tips": [
        "Perfect choice, mi amor! Lean protein won't spike blood sugar.",
        "Ask for dressing on the side - use only 1-2 tablespoons.",
        "Skip croutons or ask for a small amount (they add carbs).",
        "Add extra non-starchy veggies like cucumber, peppers."
      ]
    },
    {
      "dish": "Brown rice bowl",
      "tips": [
        "Limit rice to 1/2 cup (about the size of your fist).",
        "Ask for extra vegetables to fill you up without carbs.",
        "Pair with protein to slow glucose absorption.",
        "Consider cauliflower rice if available (much lower carb)."
      ]
    }
  ],
  "overallAdvice": "Great selections! Focus on protein first, then veggies, then carbs last. Drink water throughout the meal. This combo should keep you satisfied for 3-4 hours without big blood sugar swings.",
  "estimatedCarbs": "35-45g total if you follow portion suggestions",
  "bloodSugarImpact": "moderate - should see gradual rise, not spike"
}

Keep tips short (1 sentence each), actionable, and encouraging.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
