import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getChatResponse } from '@/lib/chat-bot';
import { getChatResponseAI } from '@/lib/ai/chat-bot-v2';
import { ChatHealthContext, UserContext } from '@/types';
import { checkRateLimit, recordAiUsage } from '@/lib/rate-limit';

// Build full health context from DB for the AI
async function buildHealthContext(
  userId: string,
  userContext?: UserContext
): Promise<ChatHealthContext> {
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Fetch in parallel: full user profile, recent glucose, recent meals, today's all meals
  const [user, recentGlucoseEntry, recentMealEntries, todayMeals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        diabetesType: true,
        targetGlucoseMin: true,
        targetGlucoseMax: true,
        age: true,
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
        foodsToKeep: true,
      },
    }),
    prisma.glucoseEntry.findFirst({
      where: { userId, measuredAt: { gte: fourHoursAgo } },
      orderBy: { measuredAt: 'desc' },
      select: { value: true, measuredAt: true, context: true },
    }),
    prisma.meal.findMany({
      where: { userId, eatenAt: { gte: sixHoursAgo } },
      orderBy: { eatenAt: 'desc' },
      take: 3,
      select: { aiSummary: true, mealType: true, eatenAt: true, carbs: true, fiber: true, protein: true, calories: true },
    }),
    prisma.meal.findMany({
      where: { userId, eatenAt: { gte: startOfToday } },
      select: { calories: true, carbs: true, protein: true, fiber: true, sodium: true, addedSugar: true },
    }),
  ]);

  const ctx: ChatHealthContext = {
    ...userContext,
    diabetesType: user?.diabetesType ?? undefined,
    targetGlucoseMin: user?.targetGlucoseMin ?? 70,
    targetGlucoseMax: user?.targetGlucoseMax ?? 180,
  };

  // Extended health profile
  if (user) {
    const conditions = user.otherConditions ? (() => { try { return JSON.parse(user.otherConditions!); } catch { return []; } })() : [];
    const meds = user.currentMedications ? (() => { try { return JSON.parse(user.currentMedications!); } catch { return []; } })() : [];

    ctx.userProfile = {
      age: user.age ?? undefined,
      activityLevel: (user.activityLevel as any) ?? undefined,
      weightGoal: (user.weightGoal as any) ?? undefined,
      otherConditions: conditions,
      currentMedications: meds,
      dailyCalorieTarget: user.dailyCalorieTarget ?? undefined,
      dailyCarbTarget: user.dailyCarbTarget ?? undefined,
      mealsPerDay: user.mealsPerDay ?? undefined,
    };
  }

  // Cultural Food Profile
  if (user) {
    const parseArr = (v: string | null | undefined) => {
      if (!v) return undefined;
      try { const a = JSON.parse(v); return Array.isArray(a) && a.length ? a : undefined; } catch { return undefined; }
    };
    const cp = {
      countryOrRegion: user.countryOrRegion ?? undefined,
      culturalFoodBackground: user.culturalFoodBackground ?? undefined,
      stapleCarbs: parseArr(user.stapleCarbs),
      commonProteins: parseArr(user.commonProteins),
      commonVegetables: parseArr(user.commonVegetables),
      commonDrinks: parseArr(user.commonDrinks),
      dietaryRestrictions: parseArr(user.dietaryRestrictions),
      religiousFoodNeeds: user.religiousFoodNeeds ?? undefined,
      foodBudgetLevel: user.foodBudgetLevel ?? undefined,
      foodAccessContext: user.foodAccessContext ?? undefined,
      cookingFrequency: user.cookingFrequency ?? undefined,
      foodPantryUse: user.foodPantryUse ?? undefined,
      foodsToKeep: parseArr(user.foodsToKeep),
    };
    if (Object.values(cp).some((v) => v !== undefined)) {
      ctx.culturalProfile = cp;
    }
  }

  // Add glucose if we have a recent reading
  if (recentGlucoseEntry) {
    const minutesAgo = Math.round(
      (now.getTime() - new Date(recentGlucoseEntry.measuredAt).getTime()) / 60000
    );
    ctx.recentGlucose = {
      value: recentGlucoseEntry.value,
      minutesAgo,
      readingContext: recentGlucoseEntry.context ?? undefined,
    };
  }

  // Add recent meals with fiber/protein/calories for richer context
  if (recentMealEntries.length > 0) {
    ctx.recentMeals = recentMealEntries.map((m) => ({
      summary: m.aiSummary ?? 'meal',
      mealType: m.mealType ?? undefined,
      minutesAgo: Math.round((now.getTime() - new Date(m.eatenAt).getTime()) / 60000),
      carbs: m.carbs ?? undefined,
      fiber: m.fiber ?? undefined,
      protein: m.protein ?? undefined,
      calories: m.calories ?? undefined,
    }));
  }

  // Today's cumulative nutrition (to judge meals in daily context)
  if (todayMeals.length > 0) {
    const sumField = (field: keyof typeof todayMeals[0]) =>
      Math.round(todayMeals.reduce((sum, m) => sum + ((m[field] as number | null) ?? 0), 0));
    // Pull today's hydration total
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const hydrationLogs = await prisma.hydrationLog.findMany({
      where: { userId, loggedAt: { gte: startOfDay }, addToDailyWaterTotal: true },
      select: { amountOz: true },
    });
    const waterOzLogged = Math.round(hydrationLogs.reduce((s, l) => s + l.amountOz, 0));

    ctx.todayNutrition = {
      caloriesConsumed: sumField('calories'),
      carbsConsumed: sumField('carbs'),
      proteinConsumed: sumField('protein'),
      fiberConsumed: sumField('fiber'),
      sodiumConsumed: sumField('sodium'),
      addedSugarConsumed: sumField('addedSugar'),
      waterOzLogged,
      mealsLogged: todayMeals.length,
    };
  }

  return ctx;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'user',
        content: message,
        userContext: context ? JSON.stringify(context) : null,
      },
    });

    let response;
    const aiEnabled = process.env.ENABLE_AI_CHAT === 'true' && !!process.env.ANTHROPIC_API_KEY;

    if (aiEnabled) {
      const limit = await checkRateLimit(session.user.id, 'chat');
      if (!limit.allowed) {
        // Fall back to template bot on rate limit
        response = getChatResponse(message, context);
      } else {
        try {
          // Build full health context (glucose + meals + profile) + conversation history in parallel
          const [healthCtx, recentMessages] = await Promise.all([
            buildHealthContext(session.user.id, context as UserContext | undefined),
            prisma.chatMessage.findMany({
              where: { userId: session.user.id },
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: { role: true, content: true },
            }),
          ]);

          const conversationHistory = recentMessages
            .reverse()
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

          response = await getChatResponseAI(message, conversationHistory, healthCtx);
          await recordAiUsage(session.user.id, 'chat');
        } catch (aiError) {
          console.error('AI chat failed, falling back to templates:', aiError);
          response = getChatResponse(message, context);
        }
      }
    } else {
      response = getChatResponse(message, context);
    }

    // Save assistant response
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: response.message,
      },
    });

    return NextResponse.json({
      message: response.message,
      suggestions: response.suggestions || [],
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
