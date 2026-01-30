import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findNearbyRestaurants } from '@/lib/restaurant-finder';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lat, lng, dish } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Find nearby restaurants (with optional dish filter)
    const result = await findNearbyRestaurants({
      location: { lat, lng },
      dish: dish || undefined,
    });

    return NextResponse.json({
      restaurants: result.restaurants,
      locationName: result.locationName,
      mode: result.mode,
      searchedDish: result.searchedDish,
    });
  } catch (error) {
    console.error('Restaurant finder error:', error);
    return NextResponse.json(
      { error: 'Failed to find nearby restaurants' },
      { status: 500 }
    );
  }
}
