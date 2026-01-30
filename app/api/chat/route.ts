import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getChatResponse } from '@/lib/chat-bot';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'user',
        content: message,
        userContext: context ? JSON.stringify(context) : null,
      },
    });

    // Get response from chatbot
    const response = getChatResponse(message, context);

    // Save assistant response
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: response.message,
      },
    });

    return NextResponse.json({
      message: response.message,
      suggestions: response.suggestions || [],
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
