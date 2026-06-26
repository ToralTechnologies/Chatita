import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const entries = await prisma.glucoseEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Glucose fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { value, context, relatedMealId, notes } = await request.json();

    if (!value || value <= 0) {
      return NextResponse.json(
        { error: 'Valid glucose value is required' },
        { status: 400 }
      );
    }

    // Validate context if provided
    const validContexts = ['fasting', 'pre-meal', 'post-meal', 'bedtime', 'random'];
    if (context && !validContexts.includes(context)) {
      return NextResponse.json(
        { error: 'Invalid context value' },
        { status: 400 }
      );
    }

    // Validate related meal exists if provided
    if (relatedMealId) {
      const meal = await prisma.meal.findFirst({
        where: {
          id: relatedMealId,
          userId: session.user.id, // Security: ensure meal belongs to user
        },
      });

      if (!meal) {
        return NextResponse.json(
          { error: 'Related meal not found' },
          { status: 404 }
        );
      }
    }

    const entry = await prisma.glucoseEntry.create({
      data: {
        userId: session.user.id,
        value: parseFloat(value),
        context: context || null,
        relatedMealId: relatedMealId || null,
        notes: notes || null,
      },
    });

    // Global glucose safety flags (IDF/WHO/ADA consensus thresholds) — deterministic, non-AI
    let emergencyFlag = false;
    let emergencySeverity: 'critical-low' | 'low' | 'critical-high' | null = null;

    type GlucoseLevel = 'very-low' | 'low' | 'in-range' | 'above-target' | 'high-check-ketones' | 'very-high';
    let glucoseFlags: { level: GlucoseLevel; category: string; action: string };

    if (entry.value < 54) {
      emergencyFlag = true;
      emergencySeverity = 'critical-low';
      glucoseFlags = { level: 'very-low', category: 'Very low — treat immediately', action: 'treat-emergency' };
    } else if (entry.value < 70) {
      emergencySeverity = 'low';
      glucoseFlags = { level: 'low', category: 'Low — treat now', action: 'treat-15-15' };
    } else if (entry.value <= 180) {
      glucoseFlags = { level: 'in-range', category: 'In target range', action: 'none' };
    } else if (entry.value <= 239) {
      glucoseFlags = { level: 'above-target', category: 'Above target', action: 'log-context' };
    } else if (entry.value <= 299) {
      emergencyFlag = true;
      emergencySeverity = 'critical-high';
      glucoseFlags = { level: 'high-check-ketones', category: 'High — check ketones', action: 'check-ketones' };
    } else {
      emergencyFlag = true;
      emergencySeverity = 'critical-high';
      glucoseFlags = { level: 'very-high', category: 'Very high — contact care team', action: 'urgent-care' };
    }

    return NextResponse.json({ entry, emergencyFlag, emergencySeverity, glucoseFlags }, { status: 201 });
  } catch (error) {
    console.error('Glucose create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
