import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // User's own recipes
          { isPublic: true }, // Public recipes
        ],
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only allow deleting own recipes
    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or not authorized' }, { status: 404 });
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recipe delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only allow updating own recipes
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found or not authorized' }, { status: 404 });
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

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameEs !== undefined && { nameEs }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(servings !== undefined && { servings: parseInt(servings) }),
        ...(prepTime !== undefined && { prepTime: prepTime ? parseInt(prepTime) : null }),
        ...(cookTime !== undefined && { cookTime: cookTime ? parseInt(cookTime) : null }),
        ...(ingredients !== undefined && { ingredients: JSON.stringify(ingredients) }),
        ...(instructions !== undefined && { instructions: JSON.stringify(instructions) }),
        ...(calories !== undefined && { calories: parseFloat(calories) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(fiber !== undefined && { fiber: fiber ? parseFloat(fiber) : null }),
        ...(sugar !== undefined && { sugar: sugar ? parseFloat(sugar) : null }),
        ...(sodium !== undefined && { sodium: sodium ? parseFloat(sodium) : null }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(carbCount !== undefined && { carbCount }),
        ...(diabetesTips !== undefined && { diabetesTips }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
