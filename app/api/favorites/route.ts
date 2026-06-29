import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withScore } from '@/lib/products/product-lookup-service';
import type { ProductCandidate } from '@/lib/products/types';

/** GET /api/favorites — saved favorite products. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await prisma.favoriteProduct.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

/** POST /api/favorites — save a product as a favorite. Body: { product, notes? }. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const c: ProductCandidate | undefined = body.product;
  if (!c || !c.name?.trim()) return NextResponse.json({ error: 'A product name is required' }, { status: 400 });
  const scored = c.fitLabel ? c : withScore(c);

  const item = await prisma.favoriteProduct.create({
    data: {
      userId: session.user.id,
      name: scored.name,
      brand: scored.brand ?? null,
      store: scored.store ?? null,
      imageUrl: scored.imageUrl ?? null,
      barcode: scored.barcode ?? null,
      category: scored.category ?? null,
      servingSize: scored.servingSize ?? null,
      calories: scored.calories ?? null,
      totalCarbs: scored.totalCarbs ?? null,
      fiber: scored.fiber ?? null,
      addedSugar: scored.addedSugar ?? null,
      protein: scored.protein ?? null,
      sodium: scored.sodium ?? null,
      saturatedFat: scored.saturatedFat ?? null,
      fitLabel: scored.fitLabel ?? null,
      diabetesNote: scored.diabetesNote ?? null,
      adhdNote: scored.adhdNote ?? null,
      notes: body.notes ?? null,
      tags: scored.tags ? JSON.stringify(scored.tags) : null,
    },
  });
  return NextResponse.json({ item });
}
