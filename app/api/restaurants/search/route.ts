import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cuisine types we recognise for diabetes-friendly tip generation
const cuisineKeywords: Record<string, string[]> = {
  Mexican: ['mexican', 'tacos', 'mexican grill', 'taqueria', 'cantina', 'tex-mex'],
  Italian: ['italian', 'pizza', 'pasta', 'pizzeria', 'trattoria'],
  Japanese: ['japanese', 'sushi', 'ramen', 'hibachi', 'japanese grill'],
  Chinese: ['chinese', 'dim sum', 'szechuan', 'cantonese', 'chinese bistro'],
  Mediterranean: ['mediterranean', 'greek', 'mediterranean grill', 'greek restaurant'],
  Thai: ['thai', 'thai kitchen', 'thai grill'],
  Indian: ['indian', 'indian kitchen', 'curry'],
  Vietnamese: ['vietnamese', 'pho', 'banh mi'],
  American: ['american', 'burger', 'grill', 'bbq', 'american grill', 'diner'],
  Greek: ['greek', 'greek kitchen', 'greek cafe'],
};

function inferCuisine(name: string, types?: string[]): string {
  const lower = name.toLowerCase();

  // Check Google place types first
  if (types) {
    if (types.includes('mexican_restaurant')) return 'Mexican';
    if (types.includes('italian_restaurant')) return 'Italian';
    if (types.includes('japanese_restaurant')) return 'Japanese';
    if (types.includes('chinese_restaurant')) return 'Chinese';
    if (types.includes('greek_restaurant')) return 'Greek';
    if (types.includes('thai_restaurant')) return 'Thai';
    if (types.includes('indian_restaurant')) return 'Indian';
    if (types.includes('vietnamese_restaurant')) return 'Vietnamese';
  }

  // Fall back to name-based matching
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) return cuisine;
  }

  return 'Restaurant';
}

// ── $0 mode: simulated name-search suggestions ──────────────────────────────
const simulatedNames = [
  { name: 'La Paloma Mexican Grill', cuisine: 'Mexican' },
  { name: 'Sakura Japanese Kitchen', cuisine: 'Japanese' },
  { name: 'Olive Branch Mediterranean', cuisine: 'Mediterranean' },
  { name: 'The Golden Dragon', cuisine: 'Chinese' },
  { name: 'Mama Rosa\'s Italian Cafe', cuisine: 'Italian' },
  { name: 'Curry House Indian Kitchen', cuisine: 'Indian' },
  { name: 'Pho Saigon Vietnamese', cuisine: 'Vietnamese' },
  { name: 'Thai Orchid', cuisine: 'Thai' },
  { name: 'Zeus Greek Kitchen', cuisine: 'Greek' },
  { name: 'The American Table', cuisine: 'American' },
  { name: 'El Taquito', cuisine: 'Mexican' },
  { name: 'Sushi & More', cuisine: 'Japanese' },
  { name: 'Green Garden Cafe', cuisine: 'Mediterranean' },
  { name: 'Casa Fiesta', cuisine: 'Mexican' },
  { name: 'Tokyo Joe\'s', cuisine: 'Japanese' },
];

function fuzzyMatch(query: string, names: typeof simulatedNames): typeof simulatedNames {
  const q = query.toLowerCase().trim();
  return names.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q)
  );
}

// ── Google Places helpers ────────────────────────────────────────────────────
async function googleTextSearch(query: string, apiKey: string) {
  const url =
    'https://maps.googleapis.com/maps/api/place/textsearch/json?' +
    `query=${encodeURIComponent(query + ' restaurant')}` +
    `&key=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

async function googleNearbySearch(lat: number, lng: number, apiKey: string) {
  const url =
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
    `location=${lat},${lng}&radius=2000&type=restaurant&key=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

// ── POST handler ─────────────────────────────────────────────────────────────
// Body shapes:
//   { mode: 'name',   query: string }                  → search suggestions
//   { mode: 'nearby', lat: number, lng: number }       → places near user for "are you at…?"
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode } = body;

    if (mode === 'name') {
      return handleNameSearch(body.query);
    }

    if (mode === 'nearby') {
      return handleNearbyDetect(body.lat, body.lng);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('Restaurant search error:', error);
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    );
  }
}

// ── name search ──────────────────────────────────────────────────────────────
async function handleNameSearch(query: string) {
  if (!query || query.trim().length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const useGoogle = process.env.ENABLE_GOOGLE_PLACES === 'true' && apiKey;

  if (useGoogle) {
    try {
      const data = await googleTextSearch(query.trim(), apiKey);
      if (data.status === 'OK' && data.results) {
        const suggestions = data.results.slice(0, 6).map((place: any) => ({
          id: place.place_id,
          name: place.name,
          cuisine: inferCuisine(place.name, place.types),
          address: place.formatted_address || place.vicinity || '',
        }));
        return NextResponse.json({ suggestions, mode: 'google' });
      }
    } catch {
      // fall through to $0
    }
  }

  // $0 fallback
  const matches = fuzzyMatch(query, simulatedNames).slice(0, 6);
  const suggestions = matches.map((r, i) => ({
    id: `sim-${i}`,
    name: r.name,
    cuisine: r.cuisine,
    address: `${1000 + i * 100} Main St`,
  }));
  return NextResponse.json({ suggestions, mode: '$0' });
}

// ── nearby detect ("are you at…?") ──────────────────────────────────────────
async function handleNearbyDetect(lat: number, lng: number) {
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const useGoogle = process.env.ENABLE_GOOGLE_PLACES === 'true' && apiKey;

  if (useGoogle) {
    try {
      const data = await googleNearbySearch(lat, lng, apiKey);
      if (data.status === 'OK' && data.results) {
        const places = data.results.slice(0, 5).map((place: any) => ({
          id: place.place_id,
          name: place.name,
          cuisine: inferCuisine(place.name, place.types),
          address: place.vicinity || '',
          distance: place.geometry?.location
            ? calcDistanceLabel(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
            : undefined,
        }));
        return NextResponse.json({ places, mode: 'google' });
      }
    } catch {
      // fall through to $0
    }
  }

  // $0 fallback – pick a few simulated names
  const sample = simulatedNames
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((r, i) => ({
      id: `sim-nearby-${i}`,
      name: r.name,
      cuisine: r.cuisine,
      address: `${1000 + i * 200} Main St`,
      distance: `${(Math.random() * 0.8 + 0.1).toFixed(1)} mi`,
    }));
  return NextResponse.json({ places: sample, mode: '$0' });
}

// ── haversine helper ─────────────────────────────────────────────────────────
function calcDistanceLabel(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 3958.8; // earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const miles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return `${miles.toFixed(1)} mi`;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
