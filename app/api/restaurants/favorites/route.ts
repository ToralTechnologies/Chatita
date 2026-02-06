import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's favorite restaurants
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favoriteRestaurant.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add restaurant to favorites
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { placeId, name, address, cuisine, rating, priceLevel, notes, tags } = body;

    if (!placeId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: placeId, name' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favoriteRestaurant.findUnique({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Restaurant already in favorites' },
        { status: 409 }
      );
    }

    const favorite = await prisma.favoriteRestaurant.create({
      data: {
        userId: session.user.id,
        placeId,
        name,
        address,
        cuisine,
        rating,
        priceLevel,
        notes,
        tags,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
