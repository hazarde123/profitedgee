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
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

    const body = await request.json();
    
    // Handle batch translation request
    if (Array.isArray(body.texts)) {
      if (!body.texts.length || !body.from || !body.to) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { 
            status: 400,
            headers: corsHeaders
          }
        );
      }

      try {
        const translations = await Promise.race([
          translateBatch({
            texts: body.texts,
            from: body.from.toUpperCase() as LanguageCode,
            to: body.to.toUpperCase() as LanguageCode
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Translation timeout')), TIMEOUT)
          )
        ]);

        return NextResponse.json(
          { translations }, 
          { headers: corsHeaders }
        );
      } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
          { error: 'Translation failed', details: error instanceof Error ? error.message : String(error) },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }
    
    // Handle single text translation
    const { text, from, to } = body;
    
    if (!text || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    try {
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

      return NextResponse.json(
        { translation },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('Translation error:', error);
      return NextResponse.json(
        { error: 'Translation failed', details: error instanceof Error ? error.message : String(error) },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
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