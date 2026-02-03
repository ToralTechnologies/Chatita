import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI is enabled
    const aiEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';
    if (!aiEnabled) {
      return NextResponse.json({
        mode: '$0',
        message: 'AI analysis is not enabled',
      });
    }

    const { photoBase64 } = await request.json();

    if (!photoBase64) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = photoBase64.includes(',')
      ? photoBase64.split(',')[1]
      : photoBase64;

    // Analyze menu with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `You are a diabetes nutrition expert analyzing a restaurant menu photo.

Please:
1. Identify ALL visible menu items/dishes from the photo
2. For each dish, provide diabetes-friendly analysis:
   - Score: "great" (low carb, high protein/fiber), "moderate" (balanced), or "caution" (high carb/sugar)
   - Estimated carbs (grams)
   - Estimated calories
   - Brief reason why it's good/moderate/caution for diabetes
   - 2-3 ordering tips to make it more diabetes-friendly

Respond in JSON format:
{
  "dishes": [
    {
      "name": "Dish name from menu",
      "score": "great|moderate|caution",
      "estimatedCarbs": 25,
      "estimatedCalories": 450,
      "reason": "Brief explanation...",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ],
  "overallAdvice": "General advice for ordering from this menu"
}

IMPORTANT:
- Extract actual dish names from the menu photo
- Be realistic with estimates
- Focus on diabetes blood sugar management
- If you can't see the menu clearly, say so
- Prioritize dishes with protein, healthy fats, and fiber
- Flag dishes with refined carbs, sugar, or heavy starches`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({
        mode: 'ai',
        dishes: [],
        overallAdvice: responseText, // Return raw text if JSON parsing fails
        error: 'Could not parse menu analysis',
      });
    }

    return NextResponse.json({
      mode: 'ai',
      dishes: analysis.dishes || [],
      overallAdvice: analysis.overallAdvice || '',
    });

  } catch (error) {
    console.error('Menu analysis error:', error);
    return NextResponse.json(
      {
        mode: '$0',
        error: 'Failed to analyze menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
