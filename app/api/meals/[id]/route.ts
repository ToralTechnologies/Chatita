import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json({ meal });
  } catch (error) {
    console.error('Meal fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      detectedFoods,
      // Core nutrition
      calories, carbs, protein, fat, fiber, sugar, sodium, portionSize,
      // Meal identity
      mealName, source, portionEatenPercent, estimateConfidence,
      // Extended nutrition
      addedSugar, saturatedFat, transFat, cholesterol, potassium,
      // Context
      mealType, feeling, restaurantName, restaurantAddress, restaurantPlaceId, eatenAt,
      // Glucose
      preMealGlucose, postMealGlucose, cgmTrend, glucoseSymptoms,
      // Medication
      medicationTaken, medicationName, medicationDose, medicationTime, medicationNotes,
      isGlp1, glp1Symptoms,
      // Snack
      snackReason, wasLowGlucoseTreatment,
      // Inline hydration
      drinkType, drinkAmountOz, drinkSweetened, drinkCarbsG, drinkCaffeine,
    } = body;

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        ...(detectedFoods !== undefined && { detectedFoods: JSON.stringify(detectedFoods) }),
        ...(mealName !== undefined && { mealName }),
        ...(source !== undefined && { source }),
        ...(portionEatenPercent !== undefined && { portionEatenPercent }),
        ...(estimateConfidence !== undefined && { estimateConfidence }),
        ...(calories !== undefined && { calories }),
        ...(carbs !== undefined && { carbs }),
        ...(protein !== undefined && { protein }),
        ...(fat !== undefined && { fat }),
        ...(fiber !== undefined && { fiber }),
        ...(sugar !== undefined && { sugar }),
        ...(sodium !== undefined && { sodium }),
        ...(portionSize !== undefined && { portionSize }),
        ...(addedSugar !== undefined && { addedSugar }),
        ...(saturatedFat !== undefined && { saturatedFat }),
        ...(transFat !== undefined && { transFat }),
        ...(cholesterol !== undefined && { cholesterol }),
        ...(potassium !== undefined && { potassium }),
        ...(mealType !== undefined && { mealType }),
        ...(feeling !== undefined && { feeling }),
        ...(restaurantName !== undefined && { restaurantName }),
        ...(restaurantAddress !== undefined && { restaurantAddress }),
        ...(restaurantPlaceId !== undefined && { restaurantPlaceId }),
        ...(eatenAt !== undefined && { eatenAt: new Date(eatenAt) }),
        ...(preMealGlucose !== undefined && { preMealGlucose }),
        ...(postMealGlucose !== undefined && { postMealGlucose }),
        ...(cgmTrend !== undefined && { cgmTrend }),
        ...(glucoseSymptoms !== undefined && { glucoseSymptoms: glucoseSymptoms ? JSON.stringify(glucoseSymptoms) : null }),
        ...(medicationTaken !== undefined && { medicationTaken }),
        ...(medicationName !== undefined && { medicationName }),
        ...(medicationDose !== undefined && { medicationDose }),
        ...(medicationTime !== undefined && { medicationTime }),
        ...(medicationNotes !== undefined && { medicationNotes }),
        ...(isGlp1 !== undefined && { isGlp1 }),
        ...(glp1Symptoms !== undefined && { glp1Symptoms: glp1Symptoms ? JSON.stringify(glp1Symptoms) : null }),
        ...(snackReason !== undefined && { snackReason }),
        ...(wasLowGlucoseTreatment !== undefined && { wasLowGlucoseTreatment }),
      },
    });

    // Add hydration log if drink data was submitted
    if (drinkType && drinkAmountOz && parseFloat(drinkAmountOz) > 0) {
      await prisma.hydrationLog.create({
        data: {
          userId: session.user.id,
          mealId: id,
          drinkType,
          amountOz: parseFloat(drinkAmountOz),
          sweetened: drinkSweetened ?? null,
          drinkCarbsG: drinkCarbsG ? parseFloat(drinkCarbsG) : null,
          caffeine: drinkCaffeine ?? null,
          addToDailyWaterTotal: true,
        },
      }).catch((err) => console.error('Hydration log error (edit):', err));
    }

    return NextResponse.json({ meal: updatedMeal });
  } catch (error) {
    console.error('Meal update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await prisma.meal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meal delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
