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
    const date = searchParams.get('date'); // YYYY-MM-DD

    let startOf: Date;
    let endOf: Date;

    if (date) {
      startOf = new Date(`${date}T00:00:00`);
      endOf = new Date(`${date}T23:59:59`);
    } else {
      // Default to today
      startOf = new Date();
      startOf.setHours(0, 0, 0, 0);
      endOf = new Date();
      endOf.setHours(23, 59, 59, 999);
    }

    const logs = await prisma.hydrationLog.findMany({
      where: {
        userId: session.user.id,
        loggedAt: { gte: startOf, lte: endOf },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const totalOz = logs
      .filter(l => l.addToDailyWaterTotal)
      .reduce((sum, l) => sum + l.amountOz, 0);

    return NextResponse.json({ logs, totalOz });
  } catch (error) {
    console.error('Hydration fetch error:', error);
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
      drinkType,
      amountOz,
      sweetened,
      drinkCarbsG,
      caffeine,
      addToDailyWaterTotal,
      mealId,
    } = body;

    if (!drinkType || !amountOz) {
      return NextResponse.json({ error: 'drinkType and amountOz are required' }, { status: 400 });
    }

    const parsedOz = parseFloat(amountOz);
    if (isNaN(parsedOz) || parsedOz <= 0) {
      return NextResponse.json({ error: 'amountOz must be a positive number' }, { status: 400 });
    }

    const log = await prisma.hydrationLog.create({
      data: {
        userId: session.user.id,
        drinkType,
        amountOz: parsedOz,
        sweetened: sweetened ?? null,
        drinkCarbsG: drinkCarbsG ? parseFloat(drinkCarbsG) : null,
        caffeine: caffeine ?? null,
        addToDailyWaterTotal: addToDailyWaterTotal !== false,
        ...(mealId && { mealId }),
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Hydration create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
