import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// OpenFoodFacts API (free, open-source food database)
const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
  serving_size?: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('code');

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
    }

    // Check local cache first
    const cached = await prisma.foodDatabase.findUnique({
      where: { barcode },
    });

    if (cached) {
      return NextResponse.json({ food: cached, source: 'cache' });
    }

    // Try OpenFoodFacts API
    try {
      const response = await fetch(
        `${OPENFOODFACTS_BASE_URL}/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'Chatita-DiabetesApp/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === 1 && data.product) {
          const product: OpenFoodFactsProduct = data.product;
          const food = processOpenFoodFactsProduct(product);

          // Cache in database
          const saved = await prisma.foodDatabase.create({
            data: food,
          });

          return NextResponse.json({ food: saved, source: 'openfoodfacts' });
        }
      }
    } catch (apiError) {
      console.error('OpenFoodFacts API error:', apiError);
    }

    // Fallback: common barcoded items
    const fallback = getFallbackBarcodeFood(barcode);
    if (fallback) {
      return NextResponse.json({ food: fallback, source: 'fallback' });
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function processOpenFoodFactsProduct(product: OpenFoodFactsProduct) {
  const nutrients = product.nutriments;

  return {
    foodName: product.product_name || 'Unknown Product',
    foodNameEs: null, // Could add translation service here
    brand: product.brands || null,
    barcode: product.code,
    servingSize: product.serving_size || '100g',
    calories: nutrients['energy-kcal_100g'] || 0,
    carbs: nutrients.carbohydrates_100g || 0,
    protein: nutrients.proteins_100g || 0,
    fat: nutrients.fat_100g || 0,
    fiber: nutrients.fiber_100g || null,
    sugar: nutrients.sugars_100g || null,
    sodium: nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : null, // Convert to mg
    source: 'openfoodfacts',
    isLowCarb: (nutrients.carbohydrates_100g || 0) < 15,
    isLowGI:
      (nutrients.carbohydrates_100g || 0) < 15 && (nutrients.fiber_100g || 0) > 3,
  };
}

function getFallbackBarcodeFood(barcode: string) {
  // Common Hispanic/Latino products - you can expand this list
  const commonProducts: Record<string, any> = {
    // Example barcodes for common products
    '041220067114': {
      // Goya Black Beans
      foodName: 'Goya Black Beans',
      foodNameEs: 'Frijoles Negros Goya',
      brand: 'Goya',
      barcode: '041220067114',
      servingSize: '1/2 cup (130g)',
      calories: 120,
      carbs: 20,
      protein: 7,
      fat: 1,
      fiber: 8,
      sugar: 1,
      sodium: 460,
      source: 'custom',
      isLowCarb: false,
      isLowGI: true,
    },
    '07203670001': {
      // Mission Corn Tortillas
      foodName: 'Mission Corn Tortillas',
      foodNameEs: 'Tortillas de Maíz Mission',
      brand: 'Mission',
      barcode: '07203670001',
      servingSize: '2 tortillas (52g)',
      calories: 100,
      carbs: 22,
      protein: 2,
      fat: 1,
      fiber: 3,
      sugar: 0,
      sodium: 10,
      source: 'custom',
      isLowCarb: false,
      isLowGI: true,
    },
  };

  return commonProducts[barcode] || null;
}
