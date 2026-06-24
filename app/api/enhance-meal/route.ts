import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, recordAiUsage } from '@/lib/rate-limit';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, foods, mealType, portionSize } = await request.json();

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        mode: '$0',
        message: 'AI enhancement not available. Please enable AI analysis or add nutrition manually.',
      });
    }

    const limit = await checkRateLimit(session.user.id, 'enhance-meal');
    if (!limit.allowed) {
      return NextResponse.json({
        mode: '$0',
        message: 'AI enhancement limit reached. Please add nutrition manually.',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the prompt based on what information the user provided
    const foodsList = foods && foods.length > 0 ? foods.join(', ') : description;
    const portionInfo = portionSize ? `Portion size: ${portionSize}` : '';
    const mealInfo = mealType ? `Meal type: ${mealType}` : '';

    const prompt = `You are a diabetes-aware nutrition assistant helping someone log a meal. Your approach is culturally sensitive, balance-focused, and non-judgmental. You focus on HOW MUCH and HOW TO BALANCE — not on whether the food is "allowed."

User provided:
- Foods: ${foodsList}
${portionInfo ? `- ${portionInfo}` : ''}
${mealInfo ? `- ${mealInfo}` : ''}

Your task:
1. Ask 1-2 clarifying questions focused on portion size and preparation (not "is this a good food")
2. Give your best nutrition estimate — fiber and protein are PRIMARY metrics alongside carbs
3. Give culturally aware, balance-focused guidance

KEY PRINCIPLES:
- NEVER suggest replacing a cultural food. Adjust portion, preparation, or add complementary foods.
- Low carb alone ≠ good meal. Assess balance: protein + fiber + healthy fats + appropriate carbs.
- Focus on "here is how much" not "don't eat this."
- Explain WHY your tips matter (fiber slows glucose absorption, protein prevents spikes, etc.)
- If this is a cultural dish, name it properly and honor it.

Respond in JSON format:
{
  "questions": [
    "What was the approximate portion of rice — about 1/2 cup, 1 cup, or more?",
    "Was the chicken grilled, fried, or braised?"
  ],
  "nutritionEstimate": {
    "calories": 520,
    "carbs": 55,
    "protein": 28,
    "fat": 14,
    "fiber": 6,
    "sugar": 4,
    "confidence": "medium",
    "note": "Estimates based on typical portions. Actual values may vary."
  },
  "mealBalance": {
    "balanceScore": "mostly-balanced",
    "balanceReason": "Good protein from chicken supports steady blood sugar. Adding a fiber-rich side would make this even better.",
    "portionGuidance": "A fist-sized portion of rice (about 1/2 cup cooked) paired with a palm-sized protein is a practical starting point."
  },
  "diabetesTips": [
    "The fiber in beans slows how quickly the carbs in tortillas raise blood sugar — they're a great combination.",
    "Eating protein before carbs (or at the same time) helps slow glucose absorption.",
    "If there's a sauce or dressing, asking for it on the side lets you control the amount."
  ],
  "culturalNote": "Carne asada tacos are a complete meal. Two corn tortillas with protein and salsa is a reasonable, satisfying portion.",
  "suggestions": [
    "Add portion size for more accurate estimates",
    "Include cooking method (grilled, fried, etc.)"
  ]
}

Use inclusive, gender-neutral language. Be warm and supportive. Do not use terms of endearment (mijo, mija, mi amor, sweetheart, etc.).`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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

    await recordAiUsage(session.user.id, 'enhance-meal');

    return NextResponse.json({
      mode: 'ai',
      ...aiResponse,
    });
  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      {
        mode: '$0',
        error: 'Failed to enhance meal with AI',
      },
      { status: 500 }
    );
  }
}
