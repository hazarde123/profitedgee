import { NextResponse } from 'next/server';
import { translateBatch, type BatchTranslationRequest } from '@/lib/translation-server';

// Increase the default body size limit for translations
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    },
    responseLimit: '8mb'
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as BatchTranslationRequest;
    
    if (!body.texts || !Array.isArray(body.texts) || !body.from || !body.to) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Add timeout for Vercel's 10s limit
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Translation timeout')), 8000);
    });

    const translationPromise = translateBatch(body);
    
    const translations = await Promise.race([
      translationPromise,
      timeoutPromise
    ]) as string[];
    
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('[/api/translate] Error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}