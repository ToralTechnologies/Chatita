import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGroceryItemData, withScore } from '@/lib/products/product-lookup-service';
import type { ProductCandidate } from '@/lib/products/types';

/** GET /api/grocery-list — current list (not removed), newest first. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.groceryListItem.findMany({
    where: { userId: session.user.id, status: { not: 'removed' } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

/**
 * POST /api/grocery-list — add one or more items.
 * Body: { product: ProductCandidate } OR { products: ProductCandidate[] }.
 * A "manual" item is just a candidate with source:'manual' and a name.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const candidates: ProductCandidate[] = body.products ?? (body.product ? [body.product] : []);
  const valid = candidates.filter((c) => c && typeof c.name === 'string' && c.name.trim());
  if (valid.length === 0) {
    return NextResponse.json({ error: 'A product name is required' }, { status: 400 });
  }

  const created = await prisma.$transaction(
    valid.map((c) =>
      prisma.groceryListItem.create({
        data: createGroceryItemData(c.fitLabel ? c : withScore(c), session.user!.id),
      })
    )
  );

  return NextResponse.json({ items: created });
}
