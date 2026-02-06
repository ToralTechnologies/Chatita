import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Generate a meal plan based on user's history and preferences
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { days = 7, targetCalories = 2000, maxCarbs = 150 } = body;

    // Get user's recent meals with complete nutrition data
    const meals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        carbs: { not: null },
        calories: { not: null },
      },
      orderBy: { eatenAt: 'desc' },
      take: 100, // Last 100 meals
    });

    if (meals.length < 3) {
      return NextResponse.json(
        {
          error: 'Insufficient meal data',
          message: 'You need at least 3 meals with nutrition information to generate a meal plan. Please log more meals with complete nutrition data.',
          mealsFound: meals.length,
          mealsRequired: 3
        },
        { status: 400 }
      );
    }

    // Score meals based on nutrition balance
    const scoredMeals = meals.map((meal) => {
      const hasNutrition = meal.carbs && meal.protein && meal.calories;

      // Start with base score
      let score = 50;

      // Bonus for complete nutrition data
      if (hasNutrition) score += 20;

      // Bonus for balanced meals (reasonable carbs)
      if (meal.carbs && meal.carbs <= maxCarbs) {
        score += 30;
      }

      return {
        ...meal,
        score,
      };
    });

    // Sort by score and filter by carbs if specified
    const goodMeals = scoredMeals
      .filter((m) => !maxCarbs || !m.carbs || m.carbs <= maxCarbs)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30); // Top 30 meals

    if (goodMeals.length < 3) {
      return NextResponse.json(
        {
          error: 'Insufficient suitable meals',
          message: `Only ${goodMeals.length} meals match your criteria (max ${maxCarbs}g carbs). Try increasing your carb limit or logging more varied meals.`,
          mealsFound: goodMeals.length,
          suggestion: 'Increase max carbs or log more meals'
        },
        { status: 400 }
      );
    }

    // Group by meal category
    const mealsByCategory: Record<string, typeof goodMeals> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
      Other: [],
    };

    goodMeals.forEach((meal) => {
      const category = meal.mealType || 'Other';
      const key = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      if (mealsByCategory[key]) {
        mealsByCategory[key].push(meal);
      } else {
        mealsByCategory.Other.push(meal);
      }
    });

    // Generate meal plan
    const mealPlan: Array<{
      day: number;
      date: string;
      meals: Array<{
        category: string;
        name: string;
        calories?: number;
        carbs?: number;
        protein?: number;
        expectedGlucoseImpact: string;
      }>;
      totalCalories: number;
      totalCarbs: number;
    }> = [];

    const today = new Date();

    for (let day = 0; day < days; day++) {
      const planDate = new Date(today);
      planDate.setDate(planDate.getDate() + day);

      const dayMeals: any[] = [];
      let dailyCalories = 0;
      let dailyCarbs = 0;

      // Select breakfast
      if (mealsByCategory.Breakfast.length > 0) {
        const breakfast =
          mealsByCategory.Breakfast[day % mealsByCategory.Breakfast.length];
        dayMeals.push({
          category: 'Breakfast',
          name: breakfast.aiSummary || 'Breakfast',
          calories: breakfast.calories,
          carbs: breakfast.carbs,
          protein: breakfast.protein,
          expectedGlucoseImpact: 'medium',
        });
        dailyCalories += breakfast.calories || 0;
        dailyCarbs += breakfast.carbs || 0;
      }

      // Select lunch
      if (mealsByCategory.Lunch.length > 0) {
        const lunch = mealsByCategory.Lunch[day % mealsByCategory.Lunch.length];
        dayMeals.push({
          category: 'Lunch',
          name: lunch.aiSummary || 'Lunch',
          calories: lunch.calories,
          carbs: lunch.carbs,
          protein: lunch.protein,
          expectedGlucoseImpact: 'medium',
        });
        dailyCalories += lunch.calories || 0;
        dailyCarbs += lunch.carbs || 0;
      }

      // Select dinner
      if (mealsByCategory.Dinner.length > 0) {
        const dinner = mealsByCategory.Dinner[day % mealsByCategory.Dinner.length];
        dayMeals.push({
          category: 'Dinner',
          name: dinner.aiSummary || 'Dinner',
          calories: dinner.calories,
          carbs: dinner.carbs,
          protein: dinner.protein,
          expectedGlucoseImpact: 'medium',
        });
        dailyCalories += dinner.calories || 0;
        dailyCarbs += dinner.carbs || 0;
      }

      // Add snack if under calorie target
      if (dailyCalories < targetCalories && mealsByCategory.Snack.length > 0) {
        const snack = mealsByCategory.Snack[day % mealsByCategory.Snack.length];
        dayMeals.push({
          category: 'Snack',
          name: snack.aiSummary || 'Snack',
          calories: snack.calories,
          carbs: snack.carbs,
          protein: snack.protein,
          expectedGlucoseImpact: 'low',
        });
        dailyCalories += snack.calories || 0;
        dailyCarbs += snack.carbs || 0;
      }

      mealPlan.push({
        day: day + 1,
        date: planDate.toLocaleDateString(),
        meals: dayMeals,
        totalCalories: Math.round(dailyCalories),
        totalCarbs: Math.round(dailyCarbs),
      });
    }

    return NextResponse.json({
      mealPlan,
      summary: {
        days,
        avgCaloriesPerDay: Math.round(
          mealPlan.reduce((sum, day) => sum + day.totalCalories, 0) / days
        ),
        avgCarbsPerDay: Math.round(
          mealPlan.reduce((sum, day) => sum + day.totalCarbs, 0) / days
        ),
        basedOnMeals: goodMeals.length,
      },
    });
  } catch (error) {
    console.error('Generate meal plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
