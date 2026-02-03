import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true';

/**
 * POST /api/restaurants/menu
 *
 * Body: { restaurantName: string, cuisine: string }
 *
 * Returns a realistic menu for the given restaurant with each dish scored
 * for diabetes-friendliness.  Falls back to a generic cuisine-based menu
 * when AI is disabled.
 *
 * Response shape:
 * {
 *   mode: 'ai' | '$0',
 *   dishes: [
 *     {
 *       name: string,           // e.g. "Grilled Salmon with Asparagus"
 *       category: string,       // e.g. "Entrée"
 *       score: 'great' | 'moderate' | 'caution',
 *       carbEstimate: string,   // e.g. "12-18g"
 *       tip: string             // one-line healthy-eating tip for this dish
 *     }
 *   ]
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantName, cuisine } = await request.json();

    if (!restaurantName || !cuisine) {
      return NextResponse.json({ error: 'restaurantName and cuisine are required' }, { status: 400 });
    }

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      // $0 fallback – generic menu based on cuisine
      return NextResponse.json({ mode: '$0', dishes: getFallbackMenu(cuisine) });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are a diabetes-friendly nutrition assistant. Generate a realistic menu for the restaurant below, then score every dish for someone managing Type 2 diabetes.

Restaurant name: ${restaurantName}
Cuisine type: ${cuisine}

Rules:
- Return 7-9 dishes that a restaurant of this cuisine and name would plausibly serve.
- Group them by category (Appetizer, Entrée, Side, Dessert, Beverage — use only categories that apply).
- Score each dish:
    "great"    = low-carb, high-protein or high-fibre, minimal blood-sugar impact
    "moderate" = some carbs but manageable with small tweaks
    "caution"  = high carb / high sugar / fried — okay occasionally with care
- carbEstimate: realistic net-carb range in grams for one typical serving (e.g. "8-14g").
- tip: ONE short, actionable sentence about how to eat this dish in a diabetes-friendly way.  Be warm — user is Latina, occasional "mi amor" is fine.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "dishes": [
    {
      "name": "...",
      "category": "...",
      "score": "great | moderate | caution",
      "carbEstimate": "Xg-Yg",
      "tip": "..."
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    // Strip any accidental markdown fences
    let raw = content.text.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.dishes)) throw new Error('Missing dishes array');

    return NextResponse.json({ mode: 'ai', dishes: parsed.dishes });
  } catch (error) {
    console.error('Menu generation error:', error);
    // Still return a usable $0 response so the UI never dead-ends
    const { cuisine } = (await (request as any).json?.() ?? {}) as { cuisine?: string };
    return NextResponse.json({ mode: '$0', dishes: getFallbackMenu(cuisine || 'Restaurant') });
  }
}

// ── $0 fallback menus ────────────────────────────────────────────────────────
// Richer than the old static maps: multiple categories, scores, carb estimates,
// and per-dish tips.  Used when AI is off OR if the AI call fails.
function getFallbackMenu(cuisine: string): ReturnType<typeof buildDish>[] {
  const menus: Record<string, ReturnType<typeof buildDish>[]> = {
    Mexican: [
      buildDish('Grilled Chicken Tacos', 'Entrée', 'moderate', '22-30g', 'Stick to 2 corn tortillas and load up on lettuce & salsa, mi amor.'),
      buildDish('Fish Tacos', 'Entrée', 'great', '14-20g', 'Great lean-protein choice — ask for corn tortillas, not flour.'),
      buildDish('Burrito Bowl (no tortilla)', 'Entrée', 'great', '18-25g', 'Skip the tortilla and limit rice to a few spoonfuls.'),
      buildDish('Fajita Vegetables & Chicken', 'Entrée', 'great', '8-12g', 'Focus on the veggies and protein — amazing for blood sugar.'),
      buildDish('Guacamole & Chips', 'Appetizer', 'caution', '25-35g', 'Guac is a healthy fat — but limit the chips to a small handful.'),
      buildDish('Churros', 'Dessert', 'caution', '40-50g', 'A small bite is fine as a treat; pair with black coffee to slow absorption.'),
      buildDish('Agua Fresca (no sugar)', 'Beverage', 'great', '0g', 'Ask for unsweetened — agua con limón is refreshing and zero carb.'),
    ],
    Italian: [
      buildDish('Grilled Salmon with Vegetables', 'Entrée', 'great', '6-10g', 'Omega-3 powerhouse — perfect pick, mi amor!'),
      buildDish('Chicken Parmigiana', 'Entrée', 'moderate', '20-28g', 'Ask for it without breading or with a light coating only.'),
      buildDish('Caprese Salad', 'Appetizer', 'great', '4-8g', 'Light, fresh, and low carb — a great starter.'),
      buildDish('Spaghetti Bolognese', 'Entrée', 'caution', '45-55g', 'If you have it, limit to a small bowl and add extra veggies.'),
      buildDish('Minestrone Soup', 'Appetizer', 'great', '12-16g', 'Fibre-rich and filling — a smart way to start your meal.'),
      buildDish('Garlic Bread', 'Side', 'caution', '28-35g', 'Skip it or share one piece with the table — it adds up fast.'),
      buildDish('Tiramisu', 'Dessert', 'caution', '35-45g', 'A small portion as a treat is okay — enjoy it slowly.'),
    ],
    Japanese: [
      buildDish('Sashimi Platter', 'Entrée', 'great', '0-2g', 'The best choice here — pure protein, zero rice.'),
      buildDish('Chicken Yakitori', 'Appetizer', 'great', '4-8g', 'Grilled and low-carb — ask for sauce on the side.'),
      buildDish('Salmon Nigiri (2 pcs)', 'Entrée', 'moderate', '18-22g', 'Delicious! Just limit to 2-3 pieces to keep carbs in check.'),
      buildDish('Miso Soup', 'Appetizer', 'great', '3-5g', 'Warming and light — great way to start without filling up on carbs.'),
      buildDish('Edamame', 'Side', 'great', '8-10g', 'High in fibre and protein — one of the best sides on the menu.'),
      buildDish('Tempura Shrimp Roll', 'Entrée', 'caution', '35-42g', 'Fried + rice = high carbs. Have a small portion if you really want it.'),
      buildDish('Green Tea (unsweetened)', 'Beverage', 'great', '0g', 'Antioxidants and zero sugar — enjoy!'),
    ],
    Chinese: [
      buildDish('Steamed Fish with Ginger', 'Entrée', 'great', '2-6g', 'Light and flavourful — one of the healthiest picks here.'),
      buildDish('Chicken & Broccoli Stir-Fry', 'Entrée', 'great', '8-14g', 'Ask for light sauce on the side, mi amor.'),
      buildDish('Dumplings (steamed, 4 pcs)', 'Appetizer', 'moderate', '18-24g', 'Choose steamed over fried and limit to 3-4 pieces.'),
      buildDish('Egg Drop Soup', 'Appetizer', 'great', '3-5g', 'Protein-packed and low carb — a lovely starter.'),
      buildDish('Kung Pao Chicken', 'Entrée', 'moderate', '12-18g', 'Tasty but can be sweet — ask for less sauce.'),
      buildDish('Fried Rice', 'Side', 'caution', '38-48g', 'Skip this or have a tiny portion — it\'s mostly carbs.'),
      buildDish('Jasmine Tea', 'Beverage', 'great', '0g', 'Calming and zero sugar. Perfect pairing.'),
    ],
    Indian: [
      buildDish('Tandoori Chicken', 'Entrée', 'great', '2-5g', 'Grilled perfection — one of the best protein choices here.'),
      buildDish('Chana Masala', 'Entrée', 'moderate', '25-32g', 'High fibre! Skip the naan and have it with a salad instead.'),
      buildDish('Spinach & Cottage Cheese (Palak Paneer)', 'Side', 'great', '6-10g', 'Rich in iron and fibre — a great side, mi amor.'),
      buildDish('Garlic Naan', 'Side', 'caution', '30-38g', 'Very carb-heavy — skip or share one small piece.'),
      buildDish('Tikka Masala', 'Entrée', 'moderate', '15-22g', 'Creamy and tasty — ask for less sauce to keep portions manageable.'),
      buildDish('Basmati Rice', 'Side', 'caution', '35-45g', 'Limit to 1/3 cup if you\'re having it.'),
      buildDish('Lassi (plain, no sugar)', 'Beverage', 'great', '5-8g', 'Probiotic goodness — just make sure it\'s unsweetened.'),
    ],
    Mediterranean: [
      buildDish('Grilled Fish with Lemon & Herbs', 'Entrée', 'great', '0-3g', 'Stunning and diabetes-friendly — omega-3 city!'),
      buildDish('Greek Salad', 'Appetizer', 'great', '6-10g', 'Fresh veggies + feta — ask for dressing on the side.'),
      buildDish('Grilled Chicken with Hummus', 'Entrée', 'great', '10-16g', 'Lean protein + healthy fats. A winning combo, mi amor.'),
      buildDish('Lentil Soup', 'Appetizer', 'great', '15-20g', 'Super high in fibre — keeps blood sugar nice and steady.'),
      buildDish('Falafel Wrap', 'Entrée', 'moderate', '28-35g', 'Tasty but the wrap adds carbs — ask for lettuce wraps instead.'),
      buildDish('Warm Pita Bread', 'Side', 'caution', '26-32g', 'Skip it or have half a piece — it adds up.'),
      buildDish('Fruit Platter', 'Dessert', 'moderate', '20-28g', 'Berries are the best pick — they\'re lower in sugar.'),
    ],
    Thai: [
      buildDish('Grilled Chicken Satay', 'Appetizer', 'great', '4-8g', 'Lean and grilled — ask for the peanut sauce on the side.'),
      buildDish('Tom Yum Soup (no noodles)', 'Appetizer', 'great', '5-9g', 'Spicy and warming — skip the noodles for a lower-carb version.'),
      buildDish('Pad Thai', 'Entrée', 'caution', '40-52g', 'Delicious but very noodle-heavy. Have a small portion if you want it.'),
      buildDish('Green Curry with Chicken', 'Entrée', 'moderate', '14-20g', 'Coconut milk in moderation — ask for less rice.'),
      buildDish('Stir-Fried Vegetables with Tofu', 'Side', 'great', '8-12g', 'Fibre + plant protein — lovely side dish.'),
      buildDish('Mango Sticky Rice', 'Dessert', 'caution', '45-55g', 'A small taste is fine as a treat — it\'s very sweet though.'),
      buildDish('Iced Thai Tea (unsweetened)', 'Beverage', 'great', '0-2g', 'Fragrant and refreshing — just make sure no sugar is added.'),
    ],
    Vietnamese: [
      buildDish('Pho with Lean Beef', 'Entrée', 'moderate', '30-38g', 'Ask for fewer noodles and extra vegetables, mi amor.'),
      buildDish('Grilled Lemongrass Chicken', 'Entrée', 'great', '2-5g', 'Beautifully flavoured and very low carb.'),
      buildDish('Fresh Spring Rolls', 'Appetizer', 'great', '10-14g', 'Light and fresh — much better than fried rolls.'),
      buildDish('Banh Mi Sandwich', 'Entrée', 'caution', '35-42g', 'The bread is the issue — ask for it in a lettuce wrap if possible.'),
      buildDish('Vermicelli Bowl with Shrimp', 'Entrée', 'moderate', '28-35g', 'Tasty! Keep the noodle portion small and load up on veggies.'),
      buildDish('Vietnamese Iced Coffee (black)', 'Beverage', 'great', '0g', 'Strong and bold — just skip the condensed milk version.'),
    ],
    American: [
      buildDish('Grilled Salmon with Asparagus', 'Entrée', 'great', '4-8g', 'One of the best things on any menu — go for it!'),
      buildDish('Grilled Chicken Breast with Veggies', 'Entrée', 'great', '6-10g', 'Classic and diabetes-friendly. Ask for no skin.'),
      buildDish('Garden Salad with Vinaigrette', 'Appetizer', 'great', '5-9g', 'Dressing on the side — dip your fork in it, not the lettuce.'),
      buildDish('Burger (no bun)', 'Entrée', 'moderate', '8-14g', 'Skip the bun or use lettuce wraps. Mustard > mayo.'),
      buildDish('Sweet Potato Fries', 'Side', 'moderate', '28-35g', 'Healthier than regular fries but still high carb — share with someone.'),
      buildDish('Regular Fries', 'Side', 'caution', '40-52g', 'High carb — skip or have a very small portion.'),
      buildDish('Apple Pie', 'Dessert', 'caution', '38-48g', 'A tiny slice as a treat is fine — enjoy it mindfully.'),
    ],
    Greek: [
      buildDish('Grilled Souvlaki with Tzatziki', 'Entrée', 'great', '4-8g', 'Protein powerhouse — tzatziki is a healthy dip too!'),
      buildDish('Greek Salad', 'Appetizer', 'great', '6-10g', 'Fresh and colourful — ask for olive oil & lemon on the side.'),
      buildDish('Grilled Fish Fillet', 'Entrée', 'great', '0-3g', 'Simple, light, and perfect for blood sugar.'),
      buildDish('Hummus with Vegetables', 'Appetizer', 'great', '8-12g', 'Healthy fats and fibre — skip the pita, use veggies to dip.'),
      buildDish('Lamb Kebabs', 'Entrée', 'great', '2-6g', 'Flavourful and low carb — a great pick, mi amor.'),
      buildDish('Pita Bread', 'Side', 'caution', '26-32g', 'Limit to half a piece or skip entirely.'),
      buildDish('Greek Yogurt with Berries', 'Dessert', 'great', '12-18g', 'High protein dessert — berries are the cherry on top!'),
    ],
  };

  return menus[cuisine] || menus['American'];
}

function buildDish(name: string, category: string, score: string, carbEstimate: string, tip: string) {
  return { name, category, score, carbEstimate, tip };
}
