import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// USDA FoodData Central API
const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY'; // Get free key at https://fdc.nal.usda.gov/api-key-signup.html
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // First check local cache
    const cached = await prisma.foodDatabase.findMany({
      where: {
        OR: [
          { foodName: { contains: query, mode: 'insensitive' } },
          { foodNameEs: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    if (cached.length > 0) {
      return NextResponse.json({ foods: cached, source: 'cache' });
    }

    // $0 Fallback: Common Hispanic/Diabetes-friendly foods
    const fallbackFoods = getFallbackFoods(query);
    if (fallbackFoods.length > 0) {
      return NextResponse.json({ foods: fallbackFoods, source: 'fallback' });
    }

    // Try USDA API if key available
    if (USDA_API_KEY && USDA_API_KEY !== 'DEMO_KEY') {
      try {
        const usdaResponse = await fetch(
          `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${USDA_API_KEY}`
        );

        if (usdaResponse.ok) {
          const data = await usdaResponse.json();
          const foods = await processUSDAFoods(data.foods || [], lang);

          // Cache results
          for (const food of foods) {
            // Check if exists by fdcId
            const existing = await prisma.foodDatabase.findFirst({
              where: { fdcId: food.fdcId },
            });

            if (existing) {
              await prisma.foodDatabase.update({
                where: { id: existing.id },
                data: { lastFetched: new Date() },
              });
            } else {
              await prisma.foodDatabase.create({ data: food });
            }
          }

          return NextResponse.json({ foods, source: 'usda' });
        }
      } catch (usdaError) {
        console.error('USDA API error:', usdaError);
        // Fall through to fallback
      }
    }

    // Return fallback if API fails
    return NextResponse.json({ foods: fallbackFoods, source: 'fallback' });
  } catch (error) {
    console.error('Food search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processUSDAFoods(usdaFoods: USDAFood[], lang: string) {
  return usdaFoods.map((food) => {
    const nutrients = extractNutrients(food.foodNutrients);

    return {
      fdcId: food.fdcId.toString(),
      foodName: food.description,
      foodNameEs: lang === 'es' ? translateToSpanish(food.description) : null,
      brand: food.brandName || null,
      barcode: null,
      servingSize: food.servingSizeUnit
        ? `${food.servingSize || 100}${food.servingSizeUnit}`
        : '100g',
      ...nutrients,
      source: 'usda',
      isLowCarb: nutrients.carbs < 15,
      isLowGI: nutrients.carbs < 15 && nutrients.fiber && nutrients.fiber > 3,
    };
  });
}

function extractNutrients(foodNutrients: USDAFood['foodNutrients']) {
  const nutrients: any = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  foodNutrients.forEach((nutrient) => {
    const name = nutrient.nutrientName.toLowerCase();
    if (name.includes('energy') || name.includes('calories')) nutrients.calories = nutrient.value;
    if (name.includes('carbohydrate')) nutrients.carbs = nutrient.value;
    if (name.includes('protein')) nutrients.protein = nutrient.value;
    if (name.includes('total lipid') || name.includes('fat')) nutrients.fat = nutrient.value;
    if (name.includes('fiber')) nutrients.fiber = nutrient.value;
    if (name.includes('sugars')) nutrients.sugar = nutrient.value;
    if (name.includes('sodium')) nutrients.sodium = nutrient.value;
  });

  return nutrients;
}

function translateToSpanish(foodName: string): string {
  const translations: Record<string, string> = {
    chicken: 'pollo',
    beef: 'carne de res',
    pork: 'cerdo',
    fish: 'pescado',
    rice: 'arroz',
    beans: 'frijoles',
    tortilla: 'tortilla',
    avocado: 'aguacate',
    tomato: 'tomate',
    onion: 'cebolla',
    cheese: 'queso',
    milk: 'leche',
    egg: 'huevo',
    bread: 'pan',
    apple: 'manzana',
  };

  let translated = foodName;
  Object.entries(translations).forEach(([en, es]) => {
    translated = translated.replace(new RegExp(en, 'gi'), es);
  });

  return translated;
}

function getFallbackFoods(query: string) {
  const q = query.toLowerCase();
  const commonFoods = [
    {
      foodName: 'Chicken Breast',
      foodNameEs: 'Pechuga de Pollo',
      servingSize: '100g',
      calories: 165,
      carbs: 0,
      protein: 31,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Brown Rice',
      foodNameEs: 'Arroz Integral',
      servingSize: '1 cup cooked',
      calories: 216,
      carbs: 45,
      protein: 5,
      fat: 1.8,
      fiber: 3.5,
      sugar: 0.7,
      sodium: 10,
      source: 'custom',
      isLowCarb: false,
      isLowGI: true,
    },
    {
      foodName: 'Black Beans',
      foodNameEs: 'Frijoles Negros',
      servingSize: '1 cup cooked',
      calories: 227,
      carbs: 41,
      protein: 15,
      fat: 0.9,
      fiber: 15,
      sugar: 0.3,
      sodium: 2,
      source: 'custom',
      isLowCarb: false,
      isLowGI: true,
    },
    {
      foodName: 'Corn Tortilla',
      foodNameEs: 'Tortilla de Maíz',
      servingSize: '1 tortilla (24g)',
      calories: 52,
      carbs: 11,
      protein: 1.4,
      fat: 0.7,
      fiber: 1.6,
      sugar: 0.2,
      sodium: 11,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Avocado',
      foodNameEs: 'Aguacate',
      servingSize: '1/2 avocado (100g)',
      calories: 160,
      carbs: 8.5,
      protein: 2,
      fat: 14.7,
      fiber: 6.7,
      sugar: 0.7,
      sodium: 7,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Greek Yogurt',
      foodNameEs: 'Yogur Griego',
      servingSize: '1 cup (170g)',
      calories: 100,
      carbs: 6,
      protein: 17,
      fat: 0,
      fiber: 0,
      sugar: 6,
      sodium: 60,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Eggs',
      foodNameEs: 'Huevos',
      servingSize: '1 large egg',
      calories: 72,
      carbs: 0.6,
      protein: 6.3,
      fat: 4.8,
      fiber: 0,
      sugar: 0.6,
      sodium: 71,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Salmon',
      foodNameEs: 'Salmón',
      servingSize: '100g',
      calories: 208,
      carbs: 0,
      protein: 20,
      fat: 13,
      fiber: 0,
      sugar: 0,
      sodium: 59,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Broccoli',
      foodNameEs: 'Brócoli',
      servingSize: '1 cup chopped (91g)',
      calories: 31,
      carbs: 6,
      protein: 2.6,
      fat: 0.3,
      fiber: 2.4,
      sugar: 1.5,
      sodium: 30,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
    {
      foodName: 'Almonds',
      foodNameEs: 'Almendras',
      servingSize: '1 oz (28g)',
      calories: 164,
      carbs: 6,
      protein: 6,
      fat: 14,
      fiber: 3.5,
      sugar: 1.2,
      sodium: 0,
      source: 'custom',
      isLowCarb: true,
      isLowGI: true,
    },
  ];

  return commonFoods.filter(
    (food) =>
      food.foodName.toLowerCase().includes(q) ||
      (food.foodNameEs && food.foodNameEs.toLowerCase().includes(q))
  );
}
