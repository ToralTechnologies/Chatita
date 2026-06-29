import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { withScore } from '@/lib/products/product-lookup-service';
import type { ProductCandidate, ProductSource } from '@/lib/products/types';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true' || process.env.ENABLE_AI_CHAT === 'true';

type Kind = 'product' | 'label' | 'receipt' | 'pantry';

const PROMPTS: Record<Kind, string> = {
  product: `These photos show a grocery product (package front and/or nutrition/ingredients label, maybe a store shelf). Extract ONE product.`,
  label: `These photos show a nutrition/ingredients label. Extract ONE product's details.`,
  receipt: `These photos show a store receipt. Extract the store, date, and each purchased food item.`,
  pantry: `These photos show the inside of a fridge or pantry. List the distinct visible food products.`,
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const kind: Kind = ['product', 'label', 'receipt', 'pantry'].includes(body.kind) ? body.kind : 'product';
    const images: string[] = Array.isArray(body.images) ? body.images.slice(0, 6) : [];
    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      // No AI available — let the client fall back to manual entry.
      return NextResponse.json({ mode: '$0', products: [] });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const content: Anthropic.MessageParam['content'] = [];

    for (const img of images) {
      let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
      if (img.startsWith('data:image/png')) mediaType = 'image/png';
      else if (img.startsWith('data:image/webp')) mediaType = 'image/webp';
      const data = img.includes(',') ? img.split(',')[1] : img;
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } });
    }

    const productShape = `{
  "name": string, "brand": string|null, "store": string|null, "quantity": string|null,
  "servingSize": string|null, "calories": number|null, "totalCarbs": number|null,
  "fiber": number|null, "addedSugar": number|null, "protein": number|null, "fat": number|null,
  "saturatedFat": number|null, "sodium": number|null, "ingredients": string|null,
  "allergens": string|null, "packageType": string|null, "category": string|null,
  "confidence": number  // 0..1: high if you can read brand+label clearly, low if blurry/partial
}`;

    const responseSpec = kind === 'receipt'
      ? `Respond ONLY with JSON: { "store": string|null, "date": string|null, "items": [${productShape}] }. For each item set source fields you can read; nutrition is usually null on receipts — that's fine.`
      : kind === 'pantry'
      ? `Respond ONLY with JSON: { "items": [${productShape}] }. List each distinct visible food once. Nutrition is usually null from a fridge photo — that's fine, just give name/brand if visible.`
      : `Respond ONLY with JSON: { "product": ${productShape} }. Read the nutrition facts carefully (per serving). If a value isn't legible, use null — do NOT guess.`;

    content.push({
      type: 'text',
      text: `You are Chatita, a careful, supportive diabetes grocery helper. ${PROMPTS[kind]}

Use inclusive, gender-neutral language. Never invent nutrition numbers — if you can't read a value, return null for it and lower the confidence. Numbers must be plain numbers (sodium in mg, carbs/fiber/sugar/protein/fat in grams).

${responseSpec}
No markdown, no extra text.`,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response');
    let raw = block.text.trim();
    if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    const source: ProductSource = kind === 'receipt' ? 'receipt' : kind === 'pantry' ? 'pantry_photo' : 'photo';

    const toCandidate = (o: any, store?: string | null): ProductCandidate => withScore({
      name: String(o.name || 'Unknown product').slice(0, 120),
      brand: o.brand ?? null,
      store: o.store ?? store ?? null,
      quantity: o.quantity ?? null,
      servingSize: o.servingSize ?? null,
      calories: o.calories ?? null,
      totalCarbs: o.totalCarbs ?? null,
      fiber: o.fiber ?? null,
      addedSugar: o.addedSugar ?? null,
      protein: o.protein ?? null,
      fat: o.fat ?? null,
      saturatedFat: o.saturatedFat ?? null,
      sodium: o.sodium ?? null,
      ingredients: o.ingredients ?? null,
      allergens: o.allergens ?? null,
      packageType: o.packageType ?? null,
      category: o.category ?? null,
      source,
      confidence: typeof o.confidence === 'number' ? o.confidence : 0.5,
    });

    if (kind === 'receipt' || kind === 'pantry') {
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      const products = items.map((o: any) => toCandidate(o, parsed.store));
      return NextResponse.json({ mode: 'ai', store: parsed.store ?? null, date: parsed.date ?? null, products });
    }

    const product = toCandidate(parsed.product ?? parsed);
    return NextResponse.json({ mode: 'ai', products: [product] });
  } catch (error) {
    console.error('[products/extract] error:', error);
    return NextResponse.json({ error: 'Could not read the photo. Please try again or add it manually.' }, { status: 500 });
  }
}
