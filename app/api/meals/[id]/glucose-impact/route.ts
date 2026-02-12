import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateMealGlucoseImpact } from '@/lib/glucose-impact';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const impact = await calculateMealGlucoseImpact(id, session.user.id);

    return NextResponse.json({ impact });
  } catch (error) {
    console.error('Glucose impact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
