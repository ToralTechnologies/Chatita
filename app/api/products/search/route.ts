import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchProducts, withScore } from '@/lib/products/product-lookup-service';

/**
 * GET /api/products/search?q=Kirkland+Greek+yogurt&store=Costco
 * Real product search via Open Food Facts + USDA FoodData Central.
 * Returns scored ProductCandidates. Never scrapes stores or claims live prices.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const store = url.searchParams.get('store') || undefined;
  if (!q) return NextResponse.json({ products: [] });

  try {
    const candidates = await searchProducts(q, store);
    const products = candidates.map((c) => withScore(c));
    return NextResponse.json({ products });
  } catch (error) {
    console.error('[products/search] error:', error);
    return NextResponse.json(
      { error: 'Search failed. You can still add the product manually.' },
      { status: 500 }
    );
  }
}
