import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const includePublic = searchParams.get('public') === 'true';

    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // User's own recipes
          ...(includePublic ? [{ isPublic: true }] : []), // Public recipes if requested
        ],
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEs: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(tag && {
          tags: { contains: tag },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error('Recipe fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nameEs,
      description,
      photoUrl,
      servings,
      prepTime,
      cookTime,
      ingredients,
      instructions,
      calories,
      carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
      tags,
      carbCount,
      diabetesTips,
      isPublic,
    } = body;

    if (!name || !ingredients || !instructions || !servings) {
      return NextResponse.json(
        { error: 'Name, ingredients, instructions, and servings are required' },
        { status: 400 }
      );
    }

    // Validate ingredients is an array
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate instructions is an array
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return NextResponse.json(
        { error: 'Instructions must be a non-empty array' },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId: session.user.id,
        name,
        nameEs: nameEs || null,
        description: description || null,
        photoUrl: photoUrl || null,
        servings: parseInt(servings),
        prepTime: prepTime ? parseInt(prepTime) : null,
        cookTime: cookTime ? parseInt(cookTime) : null,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        calories: parseFloat(calories) || 0,
        carbs: parseFloat(carbs) || 0,
        protein: parseFloat(protein) || 0,
        fat: parseFloat(fat) || 0,
        fiber: fiber ? parseFloat(fiber) : null,
        sugar: sugar ? parseFloat(sugar) : null,
        sodium: sodium ? parseFloat(sodium) : null,
        tags: tags ? JSON.stringify(tags) : null,
        carbCount: carbCount || null,
        diabetesTips: diabetesTips || null,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Recipe create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
