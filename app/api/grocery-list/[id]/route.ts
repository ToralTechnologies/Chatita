import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const EDITABLE = [
  'name', 'brand', 'store', 'category', 'quantity', 'size', 'servingSize',
  'calories', 'totalCarbs', 'fiber', 'addedSugar', 'protein', 'sodium', 'saturatedFat',
  'fitLabel', 'diabetesNote', 'adhdNote', 'storageType', 'status',
] as const;

/**
 * PATCH /api/grocery-list/[id] — update an item.
 * When status becomes "bought", the item is also copied into My Pantry.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.groceryListItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in body) data[key] = body[key];

  const updated = await prisma.groceryListItem.update({ where: { id }, data });

  let pantryItem = null;
  if (body.status === 'bought' && existing.status !== 'bought') {
    // Save bought items into My Pantry (idempotent on this grocery item).
    const already = await prisma.pantryItem.findFirst({
      where: { userId: session.user.id, sourceGroceryListItemId: id },
    });
    if (!already) {
      pantryItem = await prisma.pantryItem.create({
        data: {
          userId: session.user.id,
          sourceGroceryListItemId: id,
          sourceType: 'bought_from_list',
          name: updated.name,
          brand: updated.brand,
          store: updated.store,
          imageUrl: updated.imageUrl,
          barcode: updated.barcode,
          category: updated.category,
          quantity: updated.quantity,
          servingSize: updated.servingSize,
          calories: updated.calories,
          totalCarbs: updated.totalCarbs,
          fiber: updated.fiber,
          addedSugar: updated.addedSugar,
          protein: updated.protein,
          sodium: updated.sodium,
          saturatedFat: updated.saturatedFat,
          ingredients: updated.ingredients,
          tags: updated.tags,
          diabetesNote: updated.diabetesNote,
          adhdNote: updated.adhdNote,
          storageType: updated.storageType,
          dateBought: new Date(),
          status: 'available',
        },
      });
    }
  }

  return NextResponse.json({ item: updated, pantryItem });
}

/** DELETE /api/grocery-list/[id] — remove from the list. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.groceryListItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.groceryListItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
