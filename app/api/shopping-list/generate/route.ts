import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Generate shopping list from selected recipes or meal plan
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeIds = [] } = body;

    // Get recipes from IDs only
    if (recipeIds.length === 0) {
      return NextResponse.json(
        { error: 'Please provide recipeIds' },
        { status: 400 }
      );
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        userId: session.user.id,
      },
    });

    if (recipes.length === 0) {
      return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
    }

    // Aggregate ingredients from all recipes
    const ingredientMap = new Map<
      string,
      { amount: number; unit: string; category: string }
    >();

    recipes.forEach((recipe) => {
      const ingredients = (recipe.ingredients as unknown) as any[];

      ingredients?.forEach((ingredient: any) => {
        const key = ingredient.name.toLowerCase();

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          // Only sum if same unit
          if (existing.unit === ingredient.unit) {
            existing.amount += ingredient.amount || 0;
          }
        } else {
          ingredientMap.set(key, {
            amount: ingredient.amount || 0,
            unit: ingredient.unit || '',
            category: categorizeIngredient(ingredient.name),
          });
        }
      });
    });

    // Convert map to organized list
    const shoppingList: Record<
      string,
      Array<{ name: string; amount: number; unit: string }>
    > = {
      Produce: [],
      Meat: [],
      Dairy: [],
      Pantry: [],
      Spices: [],
      Other: [],
    };

    ingredientMap.forEach((data, name) => {
      const category = data.category;
      shoppingList[category].push({
        name: capitalizeWords(name),
        amount: Math.round(data.amount * 10) / 10, // Round to 1 decimal
        unit: data.unit,
      });
    });

    // Sort each category
    Object.keys(shoppingList).forEach((category) => {
      shoppingList[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return NextResponse.json({
      shoppingList,
      recipeCount: recipes.length,
      totalItems: ingredientMap.size,
    });
  } catch (error) {
    console.error('Generate shopping list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to categorize ingredients
function categorizeIngredient(name: string): string {
  const nameLower = name.toLowerCase();

  const produceKeywords = [
    'lettuce',
    'tomato',
    'onion',
    'garlic',
    'carrot',
    'celery',
    'pepper',
    'avocado',
    'cucumber',
    'spinach',
    'broccoli',
    'cauliflower',
    'zucchini',
    'mushroom',
    'potato',
    'apple',
    'banana',
    'lemon',
    'lime',
    'orange',
  ];

  const meatKeywords = [
    'chicken',
    'beef',
    'pork',
    'turkey',
    'fish',
    'salmon',
    'tuna',
    'shrimp',
    'meat',
    'bacon',
    'sausage',
  ];

  const dairyKeywords = [
    'milk',
    'cheese',
    'yogurt',
    'butter',
    'cream',
    'sour cream',
    'cottage cheese',
    'egg',
  ];

  const spiceKeywords = [
    'salt',
    'pepper',
    'cumin',
    'paprika',
    'oregano',
    'basil',
    'thyme',
    'cinnamon',
    'vanilla',
    'garlic powder',
    'onion powder',
  ];

  if (produceKeywords.some((kw) => nameLower.includes(kw))) return 'Produce';
  if (meatKeywords.some((kw) => nameLower.includes(kw))) return 'Meat';
  if (dairyKeywords.some((kw) => nameLower.includes(kw))) return 'Dairy';
  if (spiceKeywords.some((kw) => nameLower.includes(kw))) return 'Spices';

  return 'Pantry';
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
