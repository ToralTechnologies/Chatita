import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's recent restaurant visits
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get unique recent visits (grouped by placeId)
    const visits = await prisma.restaurantVisit.findMany({
      where: { userId: session.user.id },
      orderBy: { visitedAt: 'desc' },
      take: limit,
      distinct: ['placeId'],
    });

    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Get visits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Record a restaurant visit
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { placeId, name, address, cuisine, mealId, glucoseImpact } = body;

    if (!placeId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: placeId, name' },
        { status: 400 }
      );
    }

    const visit = await prisma.restaurantVisit.create({
      data: {
        userId: session.user.id,
        placeId,
        name,
        address,
        cuisine,
        mealId,
        glucoseImpact,
      },
    });

    return NextResponse.json({ visit }, { status: 201 });
  } catch (error) {
    console.error('Record visit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
