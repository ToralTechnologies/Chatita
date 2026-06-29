import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const EDITABLE = ['name', 'brand', 'store', 'category', 'quantity', 'storageType', 'status', 'estimatedExpirationDate'] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.pantryItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in body) data[key] = key === 'estimatedExpirationDate' && body[key] ? new Date(body[key]) : body[key];

  const item = await prisma.pantryItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.pantryItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.pantryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
