import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true' || process.env.ENABLE_AI_CHAT === 'true';

/**
 * POST /api/pantry/quick-meals — "What can I eat right now?"
 * Uses the user's available pantry items + optional prefs to suggest quick,
 * diabetes-aware, ADHD-friendly ideas. Never claims medical safety.
 * Body: { prepPreference?, energyLevel?, glp1? }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { prepPreference, energyLevel, glp1 } = body;

    const pantry = await prisma.pantryItem.findMany({
      where: { userId: session.user.id, status: 'available' },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: { name: true, brand: true, totalCarbs: true, protein: true, fiber: true, estimatedExpirationDate: true },
    });

    if (pantry.length === 0) {
      return NextResponse.json({ ideas: [], message: 'Your pantry is empty — add a few items and I can suggest quick ideas.' });
    }

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      // Deterministic fallback so the feature works without AI.
      const names = pantry.map((p) => p.name);
      return NextResponse.json({
        mode: '$0',
        ideas: [{
          title: 'Mix-and-match plate',
          prepTime: '5 min',
          ingredientsUsed: names.slice(0, 3),
          missingIngredients: [],
          diabetesNote: 'Build a plate with a protein, a fiber/veg, and a small portion of carbs. Check serving sizes.',
          adhdNote: 'No recipe needed — combine what you have.',
          carbNote: 'Keep an eye on the carb portion.',
          confidence: 'low',
        }],
      });
    }

    const pantryText = pantry.map((p) => {
      const macro = [p.protein != null ? `${p.protein}g protein` : '', p.totalCarbs != null ? `${p.totalCarbs}g carbs` : ''].filter(Boolean).join(', ');
      return `- ${p.brand ? p.brand + ' ' : ''}${p.name}${macro ? ` (${macro})` : ''}`;
    }).join('\n');

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      messages: [{ role: 'user', content: `You are Chatita, a warm, ADHD-friendly, diabetes-aware companion. Suggest 4-5 quick things the user can eat RIGHT NOW using mostly what they already have. Mix: a no-cook idea, a microwave idea, a small-meal idea, a snack, and one "use this before it expires" idea if anything is near expiry.

Their pantry:
${pantryText}

Preferences: prep=${prepPreference || 'any'}, energy=${energyLevel || 'unknown'}, smaller-portions(GLP-1)=${glp1 ? 'yes' : 'no'}.

Rules: inclusive gender-neutral language; never claim a food is medically safe; be honest if nutrition is incomplete ("check serving size"). Prefer ideas that need 0-2 missing ingredients.

Respond ONLY with JSON:
{ "ideas": [ { "title": string, "prepTime": string, "ingredientsUsed": string[], "missingIngredients": string[], "diabetesNote": string, "adhdNote": string, "carbNote": string, "confidence": "low"|"medium"|"high" } ] }
No markdown.` }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response');
    let raw = block.text.trim();
    if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]);
    return NextResponse.json({ mode: 'ai', ideas: parsed.ideas || [] });
  } catch (error) {
    console.error('[pantry/quick-meals] error:', error);
    return NextResponse.json({ error: 'Could not generate ideas right now. Please try again.' }, { status: 500 });
  }
}
