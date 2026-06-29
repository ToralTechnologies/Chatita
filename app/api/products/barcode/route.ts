import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { lookupByBarcode, withScore } from '@/lib/products/product-lookup-service';

/**
 * GET /api/products/barcode?code=0123456789
 * Looks up a product by barcode (Open Food Facts) and returns a scored
 * ProductCandidate. 404 if not found — the client should then offer photo/manual.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get('code') || '';
  if (!code) return NextResponse.json({ error: 'Missing barcode' }, { status: 400 });

  const candidate = await lookupByBarcode(code);
  if (!candidate) {
    return NextResponse.json({ found: false }, { status: 404 });
  }
  return NextResponse.json({ found: true, product: withScore(candidate) });
}
