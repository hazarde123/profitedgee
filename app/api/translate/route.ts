import { translateBatch, translateText, type LanguageCode } from '@/lib/translation-server';
import { NextResponse } from 'next/server';

// Set a timeout for the entire request
const TIMEOUT = 30000; // 30 seconds

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const lastTimestamp = requestTimestamps.get(clientId) || 0;
  const requestCount = requestCounts.get(clientId) || 0;

  // Reset counter if window has passed
  if (now - lastTimestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientId, 1);
    requestTimestamps.set(clientId, now);
    return false;
  }

  // Check if over limit
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Increment counter
  requestCounts.set(clientId, requestCount + 1);
  return false;
}

export async function POST(request: Request) {
  try {
    // Check rate limit
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Handle batch translation request
    if (Array.isArray(body.texts)) {
      if (!body.texts.length || !body.from || !body.to) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const translations = await translateBatch({
        texts: body.texts,
        from: body.from.toUpperCase() as LanguageCode,
        to: body.to.toUpperCase() as LanguageCode
      });

      return NextResponse.json({ translations });
    }
    
    // Handle single text translation
    const { text, from, to } = body;
    
    if (!text || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const translation = await translateText(
      text,
      from.toUpperCase() as LanguageCode,
      to.toUpperCase() as LanguageCode
    );

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}