import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true';

interface Recipe {
  title: string;
  description: string;
  carbEstimate: string;
  calorieEstimate: string;
  bloodSugarImpact: 'low' | 'moderate' | 'high';
  ingredients: string[];
  steps: string[];
  tips: string[];
  prepTime: string;
  servings: number;
}

/** Static $0 fallback recipes – always available, zero API cost */
function getFallbackRecipes(ingredients: string[]): Recipe[] {
  const allRecipes: Recipe[] = [
    {
      title: 'Grilled Chicken & Veggie Stir Fry',
      description: 'A quick, diabetes-friendly stir fry packed with lean protein and non-starchy veggies.',
      carbEstimate: '12-18g',
      calorieEstimate: '280-320 cal',
      bloodSugarImpact: 'low',
      ingredients: ['chicken breast', 'broccoli', 'bell peppers', 'zucchini', 'coconut aminos', 'garlic', 'olive oil', 'ginger'],
      steps: [
        'Cut chicken into bite-sized pieces and season with salt, pepper, and garlic.',
        'Heat olive oil in a large pan over medium-high heat.',
        'Cook chicken until golden, about 5-6 minutes. Set aside.',
        'Add broccoli, bell peppers, and zucchini to the pan. Stir fry 4-5 minutes.',
        'Return chicken to pan, add coconut aminos and ginger. Toss well.',
        'Serve immediately. Optional: pair with cauliflower rice.',
      ],
      tips: ['Use coconut aminos instead of soy sauce to reduce sodium.', 'Add extra veggies to fill your plate without extra carbs.', 'Great for meal prep — keeps well for 3-4 days.'],
      prepTime: '20 minutes',
      servings: 2,
    },
    {
      title: 'Avocado Egg Cups',
      description: 'Creamy avocado filled with perfectly cooked eggs — a protein-rich breakfast or snack.',
      carbEstimate: '6-10g',
      calorieEstimate: '220-260 cal',
      bloodSugarImpact: 'low',
      ingredients: ['avocados', 'eggs', 'cherry tomatoes', 'feta cheese', 'salt', 'pepper', 'chives'],
      steps: [
        'Preheat oven to 375°F (190°C).',
        'Cut avocados in half and remove the pit.',
        'Crack one egg into each avocado half. Season with salt and pepper.',
        'Place in a baking dish and bake for 12-15 minutes until egg whites are set.',
        'Top with crumbled feta, diced cherry tomatoes, and chopped chives.',
      ],
      tips: ['The healthy fats in avocado help slow glucose absorption.', 'Keep it under 15 min baking for a runny yolk.', 'Add hot sauce for extra flavor without carbs.'],
      prepTime: '20 minutes',
      servings: 2,
    },
    {
      title: 'Salmon with Roasted Asparagus',
      description: 'Omega-3 rich salmon paired with tender asparagus — anti-inflammatory and blood sugar friendly.',
      carbEstimate: '8-12g',
      calorieEstimate: '350-400 cal',
      bloodSugarImpact: 'low',
      ingredients: ['salmon fillets', 'asparagus', 'lemon', 'garlic', 'olive oil', 'dill', 'salt', 'pepper'],
      steps: [
        'Preheat oven to 400°F (200°C). Line a baking sheet with parchment.',
        'Toss asparagus with olive oil, garlic, salt, and pepper. Spread on baking sheet.',
        'Season salmon with salt, pepper, and dill. Place on top of asparagus.',
        'Squeeze lemon juice over everything.',
        'Bake for 12-15 minutes until salmon flakes easily.',
        'Serve with a squeeze of fresh lemon.',
      ],
      tips: ['Salmon\'s omega-3s help reduce inflammation linked to insulin resistance.', 'Don\'t overcook — salmon should flake with a fork.', 'Great with a simple green salad on the side.'],
      prepTime: '25 minutes',
      servings: 2,
    },
    {
      title: 'Greek Cucumber Salad',
      description: 'A refreshing, crunchy salad that\'s hydrating and incredibly low carb.',
      carbEstimate: '5-8g',
      calorieEstimate: '150-180 cal',
      bloodSugarImpact: 'low',
      ingredients: ['cucumber', 'cherry tomatoes', 'red onion', 'kalamata olives', 'feta cheese', 'olive oil', 'red wine vinegar', 'oregano'],
      steps: [
        'Chop cucumber, cherry tomatoes, and red onion into bite-sized pieces.',
        'Combine in a large bowl with sliced kalamata olives.',
        'In a small bowl, whisk together olive oil, red wine vinegar, and oregano.',
        'Pour dressing over salad and toss well.',
        'Top with crumbled feta cheese. Serve immediately or refrigerate 30 min.',
      ],
      tips: ['Cucumber is 96% water — great for hydration.', 'Add grilled chicken or shrimp for extra protein.', 'The vinegar helps with blood sugar regulation.'],
      prepTime: '15 minutes',
      servings: 2,
    },
    {
      title: 'Turkey Lettuce Wraps',
      description: 'Light and satisfying wraps using butter lettuce instead of tortillas — all the flavor, half the carbs.',
      carbEstimate: '8-14g',
      calorieEstimate: '200-250 cal',
      bloodSugarImpact: 'low',
      ingredients: ['ground turkey', 'butter lettuce leaves', 'carrots', 'water chestnuts', 'garlic', 'ginger', 'coconut aminos', 'sesame oil'],
      steps: [
        'Cook ground turkey in a pan over medium heat until browned.',
        'Add minced garlic and ginger, cook 1 minute.',
        'Stir in diced carrots, water chestnuts, coconut aminos, and sesame oil.',
        'Cook until carrots are tender, about 3-4 minutes.',
        'Spoon meat mixture into butter lettuce cups.',
        'Garnish with sliced green onion and sesame seeds.',
      ],
      tips: ['Butter lettuce makes the crunchiest wraps.', 'Water chestnuts add great texture and are low carb.', 'Use lean ground turkey to keep fat content lower.'],
      prepTime: '20 minutes',
      servings: 3,
    },
  ];

  // If ingredients were provided, try to match recipes that use them
  if (ingredients.length > 0) {
    const lowerIngredients = ingredients.map((i) => i.toLowerCase().trim());
    // Score each recipe by how many of the user's ingredients it uses
    const scored = allRecipes.map((recipe) => {
      const recipeIngredients = recipe.ingredients.map((i) => i.toLowerCase());
      const matches = lowerIngredients.filter((userIng) =>
        recipeIngredients.some((recipeIng) => recipeIng.includes(userIng) || userIng.includes(recipeIng))
      );
      return { recipe, score: matches.length };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.recipe);
  }

  return allRecipes.slice(0, 3);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ingredients, photoBase64 } = await request.json();

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      // $0 fallback
      return NextResponse.json({
        mode: '$0',
        recipes: getFallbackRecipes(ingredients || []),
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the content array — text prompt + optional fridge photo
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    if (photoBase64) {
      const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Data,
        },
      });
      contentBlocks.push({
        type: 'text',
        text: 'This is a photo of my fridge/pantry. Please identify the ingredients you can see.',
      });
    }

    const ingredientsList = ingredients && ingredients.length > 0
      ? `Available ingredients: ${ingredients.join(', ')}`
      : '';

    contentBlocks.push({
      type: 'text',
      text: `You are a diabetes-friendly recipe assistant. Generate 3-5 diabetes-friendly recipes.

${ingredientsList}
${photoBase64 ? 'Use the ingredients visible in the photo above, plus any listed.' : ''}

Requirements:
- Each recipe must be low-glycemic and suitable for someone managing blood sugar
- Prioritize lean proteins, healthy fats, and non-starchy vegetables
- Include estimated carbs per serving (keep under 30g if possible)
- Keep recipes simple (under 30 minutes prep time)
- Be encouraging and supportive — use "mi amor" once or twice

Respond in JSON format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Short, appetizing description",
      "carbEstimate": "15-20g per serving",
      "calorieEstimate": "300-350 cal per serving",
      "bloodSugarImpact": "low",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "steps": ["Step 1", "Step 2"],
      "tips": ["Tip 1 for diabetes management"],
      "prepTime": "20 minutes",
      "servings": 2
    }
  ]
}

bloodSugarImpact must be one of: "low", "moderate", "high"
Generate exactly 3 recipes.`,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      mode: 'ai',
      recipes: aiResponse.recipes || [],
    });
  } catch (error) {
    console.error('Recipes error:', error);
    // Fall back to static recipes on any error
    return NextResponse.json({
      mode: '$0',
      recipes: getFallbackRecipes([]),
    });
  }
}
