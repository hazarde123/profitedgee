import { NextResponse } from 'next/server';
import { translateBatch, type BatchTranslationRequest } from '@/lib/translation-server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as BatchTranslationRequest;
    
    if (!body.texts || !Array.isArray(body.texts) || !body.from || !body.to) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const translations = await translateBatch(body);
    
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('[/api/translate] Error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}