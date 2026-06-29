import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPantryItemData, withScore } from '@/lib/products/product-lookup-service';
import type { ProductCandidate } from '@/lib/products/types';

/** GET /api/pantry — available pantry items. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.pantryItem.findMany({
    where: { userId: session.user.id, status: 'available' },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

/**
 * POST /api/pantry — add items directly (receipt selection, pantry photo, manual).
 * Body: { products: ProductCandidate[], sourceType?: string }.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const candidates: ProductCandidate[] = body.products ?? (body.product ? [body.product] : []);
  const sourceType: string = body.sourceType || 'manual';
  const valid = candidates.filter((c) => c && typeof c.name === 'string' && c.name.trim());
  if (valid.length === 0) return NextResponse.json({ error: 'A product name is required' }, { status: 400 });

  const created = await prisma.$transaction(
    valid.map((c) =>
      prisma.pantryItem.create({
        data: createPantryItemData(c.fitLabel ? c : withScore(c), session.user!.id, sourceType),
      })
    )
  );
  return NextResponse.json({ items: created });
}
