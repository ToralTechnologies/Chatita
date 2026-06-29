import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeCompactImpact } from '@/lib/glucose-impact';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const mealType = searchParams.get('mealType');

    const meals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { aiSummary: { contains: search, mode: 'insensitive' } },
            { detectedFoods: { contains: search, mode: 'insensitive' } },
            { mealName: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(mealType && { mealType }),
      },
      orderBy: { eatenAt: 'desc' },
      take: limit,
    });

    // Attach a compact blood-sugar impact to each meal using ONE batched glucose
    // query (covering all meals' windows), so meal history can show impact
    // without a request per meal.
    let mealsWithImpact: any[] = meals;
    if (meals.length > 0) {
      const times = meals.map((m) => m.eatenAt.getTime());
      const windowStart = new Date(Math.min(...times) - 30 * 60 * 1000);
      const windowEnd = new Date(Math.max(...times) + 3 * 60 * 60 * 1000);
      const readings = await prisma.glucoseEntry.findMany({
        where: { userId: session.user.id, measuredAt: { gte: windowStart, lte: windowEnd } },
        orderBy: { measuredAt: 'asc' },
        select: { value: true, measuredAt: true },
      });
      if (readings.length > 0) {
        mealsWithImpact = meals.map((m) => ({
          ...m,
          glucoseImpact: computeCompactImpact(m.eatenAt.getTime(), readings),
        }));
      }
    }

    return NextResponse.json({ meals: mealsWithImpact });
  } catch (error) {
    console.error('Meals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      photoBase64,
      detectedFoods,
      foodEntries,
      aiSummary,
      aiConfidence,
      aiMode,
      nutritionSource,
      // Core nutrition
      calories,
      carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
      portionSize,
      // Meal identity
      mealName,
      source,
      portionEatenPercent,
      estimateConfidence,
      // Extended nutrition
      addedSugar,
      saturatedFat,
      transFat,
      cholesterol,
      potassium,
      // Context
      mealType,
      feeling,
      restaurantName,
      restaurantAddress,
      restaurantPlaceId,
      eatenAt,
      // Glucose
      preMealGlucose,
      postMealGlucose,
      cgmTrend,
      glucoseSymptoms,
      // Medication
      medicationTaken,
      medicationName,
      medicationDose,
      medicationTime,
      medicationNotes,
      isGlp1,
      glp1Symptoms,
      // Snack
      snackReason,
      wasLowGlucoseTreatment,
      // Inline hydration (creates a linked HydrationLog)
      drinkType,
      drinkAmountOz,
      drinkSweetened,
      drinkCarbsG,
      drinkCaffeine,
    } = body;

    const finalMealType = mealType || detectMealTypeFromTime();

    let finalNutritionSource = nutritionSource || 'manual';
    if (aiMode === 'ai' && !nutritionSource) finalNutritionSource = 'ai';
    if (foodEntries?.length > 0 && !nutritionSource) finalNutritionSource = 'usda';

    if (!photoBase64 && (!detectedFoods || detectedFoods.length === 0) && (!foodEntries || foodEntries.length === 0)) {
      return NextResponse.json({ error: 'Either a photo or food items are required' }, { status: 400 });
    }

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        photoBase64: photoBase64 || null,
        detectedFoods: detectedFoods?.length > 0 ? JSON.stringify(detectedFoods) : null,
        aiSummary: aiSummary || null,
        aiConfidence: aiConfidence || null,
        aiMode: aiMode || null,
        nutritionSource: finalNutritionSource,
        // Meal identity
        mealName: mealName || null,
        source: source || null,
        portionEatenPercent: portionEatenPercent ? parseFloat(portionEatenPercent) : null,
        estimateConfidence: estimateConfidence || null,
        // Core nutrition
        calories: calories || null,
        carbs: carbs || null,
        protein: protein || null,
        fat: fat || null,
        fiber: fiber || null,
        sugar: sugar || null,
        sodium: sodium || null,
        portionSize: portionSize || null,
        // Extended nutrition
        addedSugar: addedSugar || null,
        saturatedFat: saturatedFat || null,
        transFat: transFat || null,
        cholesterol: cholesterol || null,
        potassium: potassium || null,
        // Context
        mealType: finalMealType,
        feeling: feeling || null,
        restaurantName: restaurantName || null,
        restaurantAddress: restaurantAddress || null,
        restaurantPlaceId: restaurantPlaceId || null,
        ...(eatenAt && { eatenAt: new Date(eatenAt) }),
        // Glucose
        preMealGlucose: preMealGlucose || null,
        postMealGlucose: postMealGlucose || null,
        cgmTrend: cgmTrend || null,
        glucoseSymptoms: glucoseSymptoms?.length ? JSON.stringify(glucoseSymptoms) : null,
        // Medication
        medicationTaken: medicationTaken ?? null,
        medicationName: medicationName || null,
        medicationDose: medicationDose || null,
        medicationTime: medicationTime || null,
        medicationNotes: medicationNotes || null,
        isGlp1: isGlp1 ?? null,
        glp1Symptoms: glp1Symptoms?.length ? JSON.stringify(glp1Symptoms) : null,
        // Snack
        snackReason: snackReason || null,
        wasLowGlucoseTreatment: wasLowGlucoseTreatment ?? null,
        // Food entries
        ...(foodEntries?.length > 0 && {
          foodEntries: {
            create: foodEntries.map((food: any) => ({
              foodName: food.foodName,
              brand: food.brand || null,
              barcode: food.barcode || null,
              servingSize: food.servingSize,
              servingsEaten: food.servingsEaten,
              calories: food.calories,
              carbs: food.carbs,
              protein: food.protein,
              fat: food.fat,
              fiber: food.fiber || null,
              sugar: food.sugar || null,
              sodium: food.sodium || null,
              source: food.source || 'manual',
              fdcId: food.fdcId || null,
              upcCode: food.barcode || null,
            })),
          },
        }),
      },
      include: { foodEntries: true },
    });

    // Create inline hydration log if drink was logged with this meal
    if (drinkType && drinkAmountOz && parseFloat(drinkAmountOz) > 0) {
      await prisma.hydrationLog.create({
        data: {
          userId: session.user.id,
          mealId: meal.id,
          drinkType,
          amountOz: parseFloat(drinkAmountOz),
          sweetened: drinkSweetened ?? null,
          drinkCarbsG: drinkCarbsG ? parseFloat(drinkCarbsG) : null,
          caffeine: drinkCaffeine ?? null,
          addToDailyWaterTotal: true,
        },
      }).catch((err) => console.error('Hydration log error:', err));
    }

    // Create follow-up check-in for 2 hours after meal
    const scheduledFor = new Date(meal.eatenAt.getTime() + 2 * 60 * 60 * 1000);
    if (scheduledFor > new Date()) {
      await prisma.mealFollowUp.create({
        data: { mealId: meal.id, userId: session.user.id, scheduledFor },
      }).catch((err) => console.error('Follow-up creation error:', err));
    }

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    console.error('Meal create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function detectMealTypeFromTime(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
}
