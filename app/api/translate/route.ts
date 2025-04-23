import { translateBatch, translateText, type LanguageCode } from '@/lib/translation-server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    // Add CORS headers
    const headersList = await headers();
    const origin = headersList.get('origin') || '*';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Check rate limit
    const clientId = headersList.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();

    // Validate request body
    if (!body) {
      return NextResponse.json(
        { error: 'Missing request body' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Handle batch translation request
    if (Array.isArray(body.texts)) {
      if (!body.texts.length || !body.from || !body.to) {
        return NextResponse.json(
          { error: 'Missing required fields: texts, from, or to' },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        console.log('[API] Processing batch translation:', {
          textCount: body.texts.length,
          from: body.from,
          to: body.to
        });

        const translations = await Promise.race([
          translateBatch({
            texts: body.texts,
            from: body.from.toUpperCase() as LanguageCode,
            to: body.to.toUpperCase() as LanguageCode
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Translation timeout')), TIMEOUT)
          )
        ]) as string[];  // Add type assertion here

        console.log('[API] Batch translation successful:', {
          textCount: translations.length
        });

        return NextResponse.json({ translations }, { headers: corsHeaders });
      } catch (error) {
        console.error('[API] Translation error:', error);
        return NextResponse.json(
          { 
            error: 'Translation failed', 
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Handle single text translation
    const { text, from, to } = body;
    
    if (!text || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: text, from, or to' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      console.log('[API] Processing single translation:', {
        textLength: text.length,
        from,
        to
      });

      const translation = await Promise.race([
        translateText(
          text,
          from.toUpperCase() as LanguageCode,
          to.toUpperCase() as LanguageCode
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Translation timeout')), TIMEOUT)
        )
      ]);

      console.log('[API] Single translation successful');

      return NextResponse.json({ translation }, { headers: corsHeaders });
    } catch (error) {
      console.error('[API] Translation error:', error);
      return NextResponse.json(
        { 
          error: 'Translation failed', 
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred', 
        details: error instanceof Error ? error.message : String(error),
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}