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

    const { description, foods, mealType, portionSize } = await request.json();

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        mode: '$0',
        message: 'AI enhancement not available. Please enable AI analysis or add nutrition manually.',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the prompt based on what information the user provided
    const foodsList = foods && foods.length > 0 ? foods.join(', ') : description;
    const portionInfo = portionSize ? `Portion size: ${portionSize}` : '';
    const mealInfo = mealType ? `Meal type: ${mealType}` : '';

    const prompt = `You are a diabetes-friendly nutrition assistant. A user is manually logging a meal without a photo.

User provided:
- Foods: ${foodsList}
${portionInfo ? `- ${portionInfo}` : ''}
${mealInfo ? `- ${mealInfo}` : ''}

Your task:
1. Ask 2-3 clarifying questions to better estimate nutrition (portion sizes, cooking method, ingredients)
2. Based on the information provided, give your best estimate of nutrition values
3. Provide diabetes-friendly tips specific to this meal

Respond in JSON format:
{
  "questions": [
    "How was the chicken prepared (grilled, fried, baked)?",
    "What was the approximate portion size (e.g., size of your palm, 1 cup)?",
    "Were there any sauces or dressings?"
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
    "Great protein choice! Grilled chicken is lean and won't spike blood sugar.",
    "If this had a sauce, ask for it on the side next time to control sugar intake.",
    "Pair with non-starchy vegetables to add fiber and nutrients."
  ],
  "suggestions": [
    "Add portion size for more accurate estimates",
    "Include cooking method (grilled, fried, etc.)"
  ]
}

Be conversational, supportive, and culturally aware (user may be Latina). Use "mi amor" occasionally.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
