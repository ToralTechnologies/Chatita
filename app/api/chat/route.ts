import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getChatResponse } from '@/lib/chat-bot';
import { getChatResponseAI } from '@/lib/ai/chat-bot-v2';
import { ChatHealthContext, UserContext } from '@/types';

// Build full health context from DB for the AI
async function buildHealthContext(
  userId: string,
  userContext?: UserContext
): Promise<ChatHealthContext> {
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  // Fetch in parallel: user profile, recent glucose, recent meals
  const [user, recentGlucoseEntry, recentMealEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { diabetesType: true, targetGlucoseMin: true, targetGlucoseMax: true },
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
      select: { aiSummary: true, mealType: true, eatenAt: true, carbs: true },
    }),
  ]);

  const ctx: ChatHealthContext = {
    // Pass through mood/status flags from client
    ...userContext,
    // Diabetes profile
    diabetesType: user?.diabetesType ?? undefined,
    targetGlucoseMin: user?.targetGlucoseMin ?? 70,
    targetGlucoseMax: user?.targetGlucoseMax ?? 180,
  };

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

  // Add recent meals
  if (recentMealEntries.length > 0) {
    ctx.recentMeals = recentMealEntries.map((m) => ({
      summary: m.aiSummary ?? 'meal',
      mealType: m.mealType ?? undefined,
      minutesAgo: Math.round((now.getTime() - new Date(m.eatenAt).getTime()) / 60000),
      carbs: m.carbs ?? undefined,
    }));
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
      } catch (aiError) {
        console.error('AI chat failed, falling back to templates:', aiError);
        response = getChatResponse(message, context);
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
