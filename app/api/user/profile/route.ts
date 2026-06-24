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
} as const;

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

    // Parse JSON fields for the client
    return NextResponse.json({
      user: {
        ...user,
        otherConditions: user.otherConditions ? JSON.parse(user.otherConditions) : [],
        currentMedications: user.currentMedications ? JSON.parse(user.currentMedications) : [],
      },
    });
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
      otherConditions,   // array — serialized to JSON
      currentMedications, // array — serialized to JSON
      dailyCalorieTarget,
      dailyCarbTarget,
      mealsPerDay,
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
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json({
      user: {
        ...user,
        otherConditions: user.otherConditions ? JSON.parse(user.otherConditions) : [],
        currentMedications: user.currentMedications ? JSON.parse(user.currentMedications) : [],
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
