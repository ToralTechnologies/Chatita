import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  diabetesType: true,
  targetGlucoseMin: true,
  targetGlucoseMax: true,
  preferredLanguage: true,
  weeklyReportEnabled: true,
  lastReportSent: true,
  createdAt: true,
  // Extended health profile
  age: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  weightGoal: true,
  otherConditions: true,
  currentMedications: true,
  dailyCalorieTarget: true,
  dailyCarbTarget: true,
  mealsPerDay: true,
  // Cultural Food Profile
  countryOrRegion: true,
  culturalFoodBackground: true,
  commonMeals: true,
  stapleCarbs: true,
  commonProteins: true,
  commonVegetables: true,
  commonDrinks: true,
  dietaryRestrictions: true,
  religiousFoodNeeds: true,
  foodBudgetLevel: true,
  foodAccessContext: true,
  cookingFrequency: true,
  foodPantryUse: true,
  comfortFoods: true,
  foodsToKeep: true,
} as const;

function parseJsonField(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

function parsedProfile(user: Record<string, unknown>) {
  return {
    ...user,
    otherConditions: parseJsonField(user.otherConditions as string),
    currentMedications: parseJsonField(user.currentMedications as string),
    commonMeals: parseJsonField(user.commonMeals as string),
    stapleCarbs: parseJsonField(user.stapleCarbs as string),
    commonProteins: parseJsonField(user.commonProteins as string),
    commonVegetables: parseJsonField(user.commonVegetables as string),
    commonDrinks: parseJsonField(user.commonDrinks as string),
    dietaryRestrictions: parseJsonField(user.dietaryRestrictions as string),
    comfortFoods: parseJsonField(user.comfortFoods as string),
    foodsToKeep: parseJsonField(user.foodsToKeep as string),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: PROFILE_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: parsedProfile(user as Record<string, unknown>) });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      diabetesType,
      targetGlucoseMin,
      targetGlucoseMax,
      preferredLanguage,
      weeklyReportEnabled,
      // Extended health profile
      age,
      heightCm,
      weightKg,
      activityLevel,
      weightGoal,
      otherConditions,
      currentMedications,
      dailyCalorieTarget,
      dailyCarbTarget,
      mealsPerDay,
      // Cultural Food Profile
      countryOrRegion,
      culturalFoodBackground,
      commonMeals,
      stapleCarbs,
      commonProteins,
      commonVegetables,
      commonDrinks,
      dietaryRestrictions,
      religiousFoodNeeds,
      foodBudgetLevel,
      foodAccessContext,
      cookingFrequency,
      foodPantryUse,
      comfortFoods,
      foodsToKeep,
    } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(diabetesType !== undefined && { diabetesType }),
        ...(targetGlucoseMin !== undefined && { targetGlucoseMin: Number(targetGlucoseMin) }),
        ...(targetGlucoseMax !== undefined && { targetGlucoseMax: Number(targetGlucoseMax) }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(weeklyReportEnabled !== undefined && { weeklyReportEnabled }),
        ...(age !== undefined && { age: age ? Number(age) : null }),
        ...(heightCm !== undefined && { heightCm: heightCm ? Number(heightCm) : null }),
        ...(weightKg !== undefined && { weightKg: weightKg ? Number(weightKg) : null }),
        ...(activityLevel !== undefined && { activityLevel: activityLevel || null }),
        ...(weightGoal !== undefined && { weightGoal: weightGoal || null }),
        ...(otherConditions !== undefined && { otherConditions: JSON.stringify(otherConditions) }),
        ...(currentMedications !== undefined && { currentMedications: JSON.stringify(currentMedications) }),
        ...(dailyCalorieTarget !== undefined && { dailyCalorieTarget: dailyCalorieTarget ? Number(dailyCalorieTarget) : null }),
        ...(dailyCarbTarget !== undefined && { dailyCarbTarget: dailyCarbTarget ? Number(dailyCarbTarget) : null }),
        ...(mealsPerDay !== undefined && { mealsPerDay: mealsPerDay ? Number(mealsPerDay) : null }),
        // Cultural Food Profile
        ...(countryOrRegion !== undefined && { countryOrRegion: countryOrRegion || null }),
        ...(culturalFoodBackground !== undefined && { culturalFoodBackground: culturalFoodBackground || null }),
        ...(commonMeals !== undefined && { commonMeals: Array.isArray(commonMeals) ? JSON.stringify(commonMeals) : null }),
        ...(stapleCarbs !== undefined && { stapleCarbs: Array.isArray(stapleCarbs) ? JSON.stringify(stapleCarbs) : null }),
        ...(commonProteins !== undefined && { commonProteins: Array.isArray(commonProteins) ? JSON.stringify(commonProteins) : null }),
        ...(commonVegetables !== undefined && { commonVegetables: Array.isArray(commonVegetables) ? JSON.stringify(commonVegetables) : null }),
        ...(commonDrinks !== undefined && { commonDrinks: Array.isArray(commonDrinks) ? JSON.stringify(commonDrinks) : null }),
        ...(dietaryRestrictions !== undefined && { dietaryRestrictions: Array.isArray(dietaryRestrictions) ? JSON.stringify(dietaryRestrictions) : null }),
        ...(religiousFoodNeeds !== undefined && { religiousFoodNeeds: religiousFoodNeeds || null }),
        ...(foodBudgetLevel !== undefined && { foodBudgetLevel: foodBudgetLevel || null }),
        ...(foodAccessContext !== undefined && { foodAccessContext: foodAccessContext || null }),
        ...(cookingFrequency !== undefined && { cookingFrequency: cookingFrequency || null }),
        ...(foodPantryUse !== undefined && { foodPantryUse: Boolean(foodPantryUse) }),
        ...(comfortFoods !== undefined && { comfortFoods: Array.isArray(comfortFoods) ? JSON.stringify(comfortFoods) : null }),
        ...(foodsToKeep !== undefined && { foodsToKeep: Array.isArray(foodsToKeep) ? JSON.stringify(foodsToKeep) : null }),
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json({ user: parsedProfile(user as Record<string, unknown>) });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
